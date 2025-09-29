import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCv1fZLv5jXz4HBR3MlW0qLUm2ECLpw3iY';

const genAI = new GoogleGenerativeAI(API_KEY);

const MEDICAL_RESEARCHER_PROMPT = `You are a medical researcher advisor. Answer the following question with respect to these rules:

Do not make assumptions. What isn't given in the question you don't know.
Do not guess. Either you have facts or you don't answer.
Do not EVER AT ALL make or imply a diagnosis. You may only state what the literature suggests or hints toward, even if cornered, even if absolute the CASE NEVER EVEN THINK ABOUT STATING DEFINITIVE THINGS.
Answer concise and straight to the point.
Only use established medical literature for answering, link it too. If there is no source, do not provide an answer.

Respond in a JSON format which looks like this, and make the answer string in markdown format:
{
  "answer": string,
  "source": list[string]
}

The answer should be maximum three sentences.`;

export interface MedicalResponse {
  answer: string;
  source: string[];
}

export const askMedicalQuestion = async (question: string): Promise<MedicalResponse> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
        responseMimeType: "application/json"
      }
    });

    const prompt = `${MEDICAL_RESEARCHER_PROMPT}\n\nThe question is:\n"${question}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const parsedResponse = JSON.parse(text) as MedicalResponse;
      return parsedResponse;
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      return {
        answer: "Unable to parse response. Please try rephrasing your question.",
        source: []
      };
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Provide more specific error message
    const errorMessage = error instanceof Error && error.message.includes('API key')
      ? "API key error. Please check your Gemini API key configuration."
      : error instanceof Error && error.message.includes('model')
      ? "Model not available. Please check the model name."
      : "An error occurred while processing your question. Please check the console for details.";

    return {
      answer: errorMessage,
      source: []
    };
  }
};