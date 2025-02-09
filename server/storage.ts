import { users, documents, questionAnalysis, type User, type InsertUser, type Document, type QuestionAnalysis } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByUser(userId: number): Promise<Document[]>;
  createDocument(doc: Omit<Document, "id" | "uploadedAt">): Promise<Document>;
  updateDocumentAnalysis(id: number, analysis: any): Promise<Document>;

  getQuestionAnalysis(documentId: number): Promise<QuestionAnalysis[]>;
  createQuestionAnalysis(analysis: Omit<QuestionAnalysis, "id" | "lastSeenAt">): Promise<QuestionAnalysis>;
  updateQuestionFrequency(id: number, newFrequency: number): Promise<QuestionAnalysis>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.userId, userId));
  }

  async createDocument(doc: Omit<Document, "id" | "uploadedAt">): Promise<Document> {
    const [document] = await db.insert(documents).values(doc).returning();
    return document;
  }

  async updateDocumentAnalysis(id: number, analysis: any): Promise<Document> {
    const [doc] = await db
      .update(documents)
      .set({ analysis })
      .where(eq(documents.id, id))
      .returning();
    return doc;
  }

  async getQuestionAnalysis(documentId: number): Promise<QuestionAnalysis[]> {
    return db
      .select()
      .from(questionAnalysis)
      .where(eq(questionAnalysis.documentId, documentId));
  }

  async createQuestionAnalysis(analysis: Omit<QuestionAnalysis, "id" | "lastSeenAt">): Promise<QuestionAnalysis> {
    const [result] = await db.insert(questionAnalysis).values(analysis).returning();
    return result;
  }

  async updateQuestionFrequency(id: number, newFrequency: number): Promise<QuestionAnalysis> {
    const [analysis] = await db
      .update(questionAnalysis)
      .set({ 
        frequency: newFrequency,
        lastSeenAt: new Date()
      })
      .where(eq(questionAnalysis.id, id))
      .returning();
    return analysis;
  }
}

export const storage = new DatabaseStorage();