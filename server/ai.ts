import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

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
  const prompt = `Analyze this question paper content and extract:
1. Main topics covered
2. Types of questions (e.g. MCQ, descriptive, numerical)
3. Difficulty level (1-5)
4. List of individual questions with any similar/repeated questions grouped together

Format your response as JSON with this structure:
{
  "topics": string[],
  "questionTypes": string[],
  "difficulty": number,
  "questions": [
    {
      "text": "Full question text",
      "frequency": number (how often this type of question appears),
      "similarQuestions": ["Similar question texts"]
    }
  ]
}

Content to analyze:
${content}`;

  const response = await hf.textGeneration({
    model: "deepseek-ai/deepseek-coder-33b-instruct",
    inputs: prompt,
    parameters: {
      max_new_tokens: 2000,
      temperature: 0.3, // Lower temperature for more focused analysis
    }
  });

  try {
    const jsonStart = response.generated_text.indexOf('{');
    const jsonEnd = response.generated_text.lastIndexOf('}') + 1;
    const jsonStr = response.generated_text.slice(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Failed to analyze document');
  }
}

export async function generateQuestions(
  content: string,
  numQuestions: number = 5
): Promise<{ questions: string[]; explanations: string[] }> {
  const prompt = `Generate ${numQuestions} questions similar to the style and format of questions in this content. For each question, provide a detailed explanation of why this type of question is important and commonly asked.

Content to base questions on:
${content}`;

  const response = await hf.textGeneration({
    model: "deepseek-ai/deepseek-coder-33b-instruct",
    inputs: prompt,
    parameters: {
      max_new_tokens: 2000,
      temperature: 0.7,
    }
  });

  try {
    const jsonStart = response.generated_text.indexOf('{');
    const jsonEnd = response.generated_text.lastIndexOf('}') + 1;
    const jsonStr = response.generated_text.slice(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Failed to generate questions');
  }
}