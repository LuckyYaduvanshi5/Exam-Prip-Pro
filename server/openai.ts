import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeDocument(content: string): Promise<{
  topics: string[];
  questionTypes: string[];
  difficulty: number;
  questions: {
    text: string;
    frequency: number;
    similarQuestions: string[];
  }[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in analyzing educational content and question papers. Extract key topics, question types, difficulty level, and identify similar questions and patterns.",
        },
        {
          role: "user",
          content: `Analyze this question paper and provide:
1. Main topics covered
2. Types of questions (e.g. MCQ, descriptive, numerical)
3. Difficulty level (1-5)
4. Individual questions with frequency and similar questions grouped

Content to analyze:
${content}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw error; // Re-throw to be handled by calling function
  }
}

export async function generateSimilarQuestions(
  questionText: string,
  numQuestions: number = 3
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate similar questions that test the same concept but with different contexts or values.",
        },
        {
          role: "user",
          content: `Original question: ${questionText}\nGenerate ${numQuestions} similar questions.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.questions || [];
  } catch (error) {
    console.error("Error generating similar questions:", error);
    throw error; // Re-throw to be handled by calling function
  }
}