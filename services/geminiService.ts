
import { GoogleGenAI, Type } from "@google/genai";
import { EngineeringField } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const solveEngineeringProblem = async (
  query: string,
  field: EngineeringField,
  imageData?: string,
  language: 'en' | 'sw' = 'en'
) => {
  const model = 'gemini-3-pro-preview';
  
  const languageInstruction = language === 'sw' 
    ? "IMPORTANT: You MUST provide all technical descriptions, steps, analysis, and verdicts in SWAHILI (Kiswahili). Technical terms can remain in English in parentheses if necessary for clarity (e.g., 'mzunguko wa umeme (circuit)')."
    : "Respond in English.";

  const systemInstruction = `You are the OmniENG53 Project Controller. 
  Your goal is to solve complex engineering problems while managing project constraints with 100% accuracy.
  
  ${languageInstruction}

  Persona Rules:
  1. TECHNICAL: Provide a detailed engineering fix.
  2. SCOPE: Provide a specific message in "projectScopeConfirm" asking the user to verify the solution against the client's Work Order (WO).
  3. BUDGET: Provide an estimated "timeToComplete" (e.g., "4-6 man-hours") for this specific task.
  4. FOLLOW-UP: Generate a "followUp24h" and "followUp7d" checklist for the technician to revisit and verify the fix.
  5. SAFETY: ALWAYS start with a 'SAFETY CHECK' if the user mentions electricity, high voltage, or heavy machinery.
  6. CLARIFICATION: If the problem is vague, ask 2 specific technical questions in "clarificationQuestions".
  7. DIAGNOSTICS: Use a 'Diagnostic Tree' approach (hypothesis -> test).
  8. TONE: Professional, operational, and focused on minimizing downtime and managing resources.

  Output your response in a valid JSON format following this schema:
  {
    "safetyCheck": "Mandatory if risk exists. Otherwise empty.",
    "analysis": "Technical engineering fix and assessment.",
    "diagnosticTree": [
      { "hypothesis": "Potential cause", "test": "Test to confirm" }
    ],
    "clarificationQuestions": ["Question 1?", "Question 2?"],
    "projectScopeConfirm": "Mandatory scope verification message.",
    "timeToComplete": "Estimated duration for the fix.",
    "followUp24h": ["Step 1", "Step 2"],
    "followUp7d": ["Step 1", "Step 2"],
    "variables": { "key": "value" },
    "steps": ["Step 1 description", "Step 2..."],
    "finalResult": "The definitive solution or verdict.",
    "confidence": 0.0 to 1.0
  }`;

  const contents = imageData 
    ? {
        parts: [
          { text: `Field: ${field}. Problem: ${query}` },
          { inlineData: { data: imageData.split(',')[1], mimeType: 'image/jpeg' } }
        ]
      }
    : `Field: ${field}. Problem: ${query}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 16000 },
        maxOutputTokens: 4000
      },
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Controller link failure: The diagnostic data returned was corrupted. Please re-run the assessment.");
    }

  } catch (apiError) {
    console.error("API Call failed:", apiError);
    throw new Error("⚠️ CONNECTION ERROR: The AI is currently overloaded or the internet is unstable. Please wait 10 seconds and try your request again.");
  }
};

export const extractBOM = async (technicalSolution: string, language: 'en' | 'sw' = 'en') => {
  const model = 'gemini-3-pro-preview';
  
  const languageInstruction = language === 'sw' 
    ? "Return the results in SWAHILI (Kiswahili)."
    : "Return the results in English.";

  const prompt = `Analyze the following engineering solution and extract a detailed Bill of Materials (BOM).
    ${languageInstruction}
    
    Return the result as a JSON list of objects following this schema:
    {
      "bom": [
        {
          "itemName": "Specific part name",
          "specification": "Technical specs (dimensions, ratings, etc.)",
          "quantity": "Amount with units",
          "priority": "High, Medium, or Low"
        }
      ]
    }

    Engineering Solution:
    ${technicalSolution}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    try {
      const parsed = JSON.parse(response.text || '{"bom": []}');
      return parsed.bom;
    } catch (e) {
      throw new Error("Failed to parse BOM data.");
    }
  } catch (err) {
    throw new Error("⚠️ CONNECTION ERROR: Failed to generate Bill of Materials.");
  }
};
