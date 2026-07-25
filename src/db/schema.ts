import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Example table to validate the Drizzle + Neon setup.
// Replace or extend with the real schema in a later phase.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
