/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Posters, resumes and photos are uploaded through server actions.
      // Files are capped at 4 MB each in src/lib/storage.ts.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
