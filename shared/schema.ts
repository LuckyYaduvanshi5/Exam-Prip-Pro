import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  analysis: jsonb("analysis"), // Store the complete analysis including question frequency
});

export const questionAnalysis = pgTable("question_analysis", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  questionText: text("question_text").notNull(),
  frequency: integer("frequency").notNull(),
  similarQuestions: jsonb("similar_questions").notNull(), // Array of similar question texts
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  content: true,
  fileType: true,
});

export const insertQuestionAnalysisSchema = createInsertSchema(questionAnalysis).pick({
  documentId: true,
  questionText: true,
  frequency: true,
  similarQuestions: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type QuestionAnalysis = typeof questionAnalysis.$inferSelect;