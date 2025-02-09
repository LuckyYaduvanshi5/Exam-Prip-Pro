import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { analyzeDocument } from "./openai";
import multer from "multer";
import { insertDocumentSchema } from "@shared/schema";

const upload = multer();

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Document routes
  app.post("/api/documents/batch", requireAuth, upload.array("files", 5), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      console.log('Processing files:', files.map(f => ({ name: f.originalname, type: f.mimetype })));

      const uploadedDocs = await Promise.all(
        files.map(async (file) => {
          try {
            // Convert binary content to base64 for storage
            const content = file.buffer.toString('base64');

            // Create document record
            const doc = await storage.createDocument({
              userId: req.user!.id,
              name: file.originalname,
              content: content,
              fileType: file.mimetype,
              analysis: null // Initialize with no analysis
            });

            // For text files, analyze immediately
            if (file.mimetype === 'text/plain' || file.mimetype.includes('text')) {
              try {
                // Decode base64 for text analysis
                const textContent = Buffer.from(content, 'base64').toString('utf-8');
                const analysis = await analyzeDocument(textContent);

                // Update document with analysis
                await storage.updateDocumentAnalysis(doc.id, analysis);

                // Store individual question analysis
                await Promise.all(analysis.questions.map(q => 
                  storage.createQuestionAnalysis({
                    documentId: doc.id,
                    questionText: q.text,
                    frequency: q.frequency,
                    similarQuestions: q.similarQuestions
                  })
                ));
              } catch (analysisError) {
                console.error('Analysis error for document:', doc.id, analysisError);
                // Continue without analysis, don't fail the upload
              }
            }

            console.log('Document processed:', { id: doc.id, name: doc.name });
            return doc;
          } catch (error) {
            console.error('Error processing file:', file.originalname, error);
            throw error;
          }
        })
      );

      res.status(201).json(uploadedDocs);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });

  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const docs = await storage.getDocumentsByUser(req.user!.id);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id/analysis", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(parseInt(req.params.id));
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      // If analysis doesn't exist, perform it
      if (!doc.analysis) {
        try {
          const content = Buffer.from(doc.content, 'base64').toString('utf-8');
          console.log('Starting OpenAI analysis...');
          const analysis = await analyzeDocument(content);
          console.log('Analysis completed successfully');
          
          // Update document with analysis
          await storage.updateDocumentAnalysis(doc.id, analysis);
          
          // Store individual questions
          await Promise.all(analysis.questions.map(q => 
            storage.createQuestionAnalysis({
              documentId: doc.id,
              questionText: q.text,
              frequency: q.frequency,
              similarQuestions: q.similarQuestions
            })
          ));
        } catch (error) {
          console.error('Analysis error:', error);
          throw error;
        }
        
        // Store individual questions
        await Promise.all(analysis.questions.map(q => 
          storage.createQuestionAnalysis({
            documentId: doc.id,
            questionText: q.text,
            frequency: q.frequency,
            similarQuestions: q.similarQuestions
          })
        ));
        
        return res.json(analysis);
      }

      // Return existing analysis
      const analysis = await storage.getQuestionAnalysis(doc.id);
      res.json({
        ...doc.analysis,
        questions: analysis
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

app.post("/api/documents/:id/questions/similar", requireAuth, async (req, res) => {
    try {
      const { questionText } = req.body;
      if (!questionText) {
        return res.status(400).json({ message: "Question text is required" });
      }
      
      const similarQuestions = await generateSimilarQuestions(questionText);
      res.json({ similarQuestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate similar questions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}