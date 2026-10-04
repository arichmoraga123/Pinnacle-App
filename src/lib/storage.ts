import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * File storage for posters, resumes and photos.
 *
 * Production: any S3-compatible bucket (Cloudflare R2 recommended), configured
 * with the S3_* env vars. Files stay private; the app serves them through
 * /files routes that check permissions.
 *
 * Development without S3_* set: files go to ./.uploads on local disk.
 */

const KINDS = {
  poster: {
    maxBytes: 4 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp"],
  },
  photo: {
    maxBytes: 4 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp"],
  },
  resume: {
    maxBytes: 4 * 1024 * 1024,
    types: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
} as const;

export type UploadKind = keyof typeof KINDS;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const CONTENT_TYPES = Object.fromEntries(
  Object.entries(EXTENSIONS).map(([type, ext]) => [ext, type]),
);

export function contentTypeForKey(key: string) {
  const ext = key.split(".").pop() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

/** Check the file's leading bytes so a renamed file can't pose as a PDF/image. */
function sniff(bytes: Uint8Array): string | null {
  const hex = (n: number) =>
    Array.from(bytes.slice(0, n))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...Array.from(bytes.slice(from, to)));

  if (hex(3) === "ffd8ff") return "image/jpeg";
  if (hex(8) === "89504e470d0a1a0a") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  if (hex(8) === "d0cf11e0a1b11ae1") return "application/msword";
  if (hex(4) === "504b0304") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

export class UploadError extends Error {}

/** True when the form field holds an actual file (browsers send an empty one). */
export function hasFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && value.size > 0;
}

/**
 * Validate and store an uploaded file. Returns the storage key.
 * Throws UploadError with a user-facing message when the file is rejected.
 */
export async function saveUpload(file: File, kind: UploadKind) {
  const rules = KINDS[kind];
  if (file.size > rules.maxBytes) {
    throw new UploadError(
      `File is too large (max ${rules.maxBytes / 1024 / 1024} MB).`,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type || !(rules.types as readonly string[]).includes(type)) {
    throw new UploadError(
      kind === "resume"
        ? "Resume must be a PDF, Word document or image."
        : "Image must be a JPG, PNG or WebP.",
    );
  }

  const key = `${kind}s/${randomUUID()}.${EXTENSIONS[type]}`;
  await backend().put(key, bytes, type);
  return key;
}

/** Returns the file's bytes as an ArrayBuffer (ready for `new Response`). */
export async function readUpload(key: string): Promise<ArrayBuffer | null> {
  const bytes = await backend().get(key);
  if (!bytes) return null;
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

/** Best effort: a leftover object is harmless, a failed save is not. */
export async function deleteUpload(key: string | null | undefined) {
  if (!key) return;
  try {
    await backend().delete(key);
  } catch (error) {
    console.error(`Failed to delete upload ${key}:`, error);
  }
}

type Backend = {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
};

let cached: Backend | undefined;

function backend(): Backend {
  cached ??= process.env.S3_BUCKET ? s3Backend() : localBackend();
  return cached;
}

function s3Backend(): Backend {
  const bucket = process.env.S3_BUCKET!;
  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },
    async get(key) {
      try {
        const res = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        return res.Body ? await res.Body.transformToByteArray() : null;
      } catch (error) {
        if ((error as { name?: string }).name === "NoSuchKey") return null;
        throw error;
      }
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

function localBackend(): Backend {
  if (process.env.VERCEL) {
    // Vercel's filesystem is read-only and not shared between requests.
    throw new UploadError(
      "File storage isn't configured yet (set the S3_* environment variables).",
    );
  }

  const root = path.join(process.cwd(), ".uploads");
  const resolve = (key: string) => {
    const full = path.join(root, key);
    if (!full.startsWith(root + path.sep)) throw new Error("Bad key");
    return full;
  };

  return {
    async put(key, body) {
      const full = resolve(key);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, body);
    },
    async get(key) {
      try {
        return new Uint8Array(await readFile(resolve(key)));
      } catch {
        return null;
      }
    },
    async delete(key) {
      await unlink(resolve(key)).catch(() => {});
    },
  };
}
