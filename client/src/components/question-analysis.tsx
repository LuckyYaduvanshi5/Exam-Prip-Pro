
import { useEffect, useState } from 'react';

interface Question {
  text: string;
  frequency: number;
  similarQuestions: string[];
}

interface AnalysisResult {
  topics: string[];
  questionTypes: string[];
  difficulty: number;
  questions: Question[];
}

export function QuestionAnalysis({ documentId }: { documentId: number }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  const startAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/analysis`);
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <div className="flex justify-center p-4">
        <button 
          onClick={startAnalysis}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
        >
          Start AI Analysis
        </button>
      </div>
    );
  }

  if (loading) return <div>Analyzing document...</div>;
  if (!analysis) return <div>No analysis available</div>;

  // Group questions by frequency
  const frequencyGroups = {
    high: analysis.questions.filter(q => q.frequency >= 3),
    medium: analysis.questions.filter(q => q.frequency === 2),
    low: analysis.questions.filter(q => q.frequency === 1)
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Topics Covered:</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.topics.map((topic, i) => (
            <span key={i} className="bg-blue-100 px-2 py-1 rounded">
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Questions by Frequency:</h3>
        
        {Object.entries(frequencyGroups).map(([group, questions]) => (
          <div key={group} className="mb-6">
            <h4 className="text-lg font-medium mb-2 capitalize">
              {group} Frequency Questions ({questions.length})
            </h4>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="border p-4 rounded-lg">
                  <p className="font-medium">{q.text}</p>
                  {q.similarQuestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Similar Questions:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {q.similarQuestions.map((sq, j) => (
                          <li key={j}>{sq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
