import express from 'express';
import ViteExpress from 'vite-express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.post('/api/gemini/copilot', async (req, res) => {
  try {
    const { messages, dataContext } = req.body;
    
    // Convert dataContext into a structured system prompt
    const systemInstruction = `You are PaymentMemory AI Copilot, a helpful financial assistant.
You have access to the user's financial data. Answer their questions based ONLY on this data.
Be encouraging and never shaming.

User's Data Context:
${JSON.stringify(dataContext, null, 2)}
`;

    // Extract the latest message and history
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Copilot Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gemini/scan-bills', async (req, res) => {
  try {
    const { emails } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze these emails and extract any bills, receipts, or subscriptions.
Emails: ${JSON.stringify(emails)}`,
      config: {
        systemInstruction: "You are an AI that extracts financial transactions from emails. Return a JSON array of objects with merchant, amount, dueDate, and likely category.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              merchant: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              dueDate: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["merchant", "amount", "category"]
          }
        }
      }
    });

    res.json({ results: JSON.parse(response.text?.trim() || "[]") });
  } catch (error: any) {
    console.error('Scan Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gemini/scan-receipt', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing file data or mimeType' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          {
            text: 'Analyze this receipt and extract the merchant name, total amount, tax/GST amount, date, payment method (if visible), and a list of line items with their names and prices. Ensure the amounts are parsed as numbers.'
          },
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            taxAmount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            paymentMethod: { type: Type.STRING },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                },
                required: ["name", "price"]
              }
            }
          },
          required: ["merchant", "totalAmount", "date"]
        }
      }
    });

    res.json({ results: JSON.parse(response.text?.trim() || "{}") });
  } catch (error: any) {
    console.error('Scan Receipt Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gemini/predict', async (req, res) => {
  try {
    const { transactions, budgets } = req.body;
    
    if (!transactions || transactions.length < 10) { // arbitrary threshold for "not enough history"
      return res.json({ 
        notEnoughHistory: true, 
        message: "We need a bit more transaction history (at least a few months) to provide accurate AI predictions." 
      });
    }

    const systemInstruction = `You are a financial forecasting AI. Analyze the user's past transactions and budgets.
Return a JSON object containing:
1. forecastByCategory: An array with predicted next-month spending for each category based on historical averages and trends.
2. warnings: An array of strings warning about budgets likely to be overrun this month based on the current spending pace.
3. cashFlowOutlook: A short plain-language paragraph summarizing the overall financial trajectory.
Be realistic and clearly state these are estimates.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Transactions: ${JSON.stringify(transactions)}\nBudgets: ${JSON.stringify(budgets)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            forecastByCategory: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  predictedAmount: { type: Type.NUMBER }
                },
                required: ["category", "predictedAmount"]
              }
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            cashFlowOutlook: { type: Type.STRING }
          },
          required: ["forecastByCategory", "warnings", "cashFlowOutlook"]
        }
      }
    });

    res.json({ results: JSON.parse(response.text?.trim() || "{}") });
  } catch (error: any) {
    console.error('Prediction Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT) || 3000;
ViteExpress.listen(app, port, () => {
  console.log(`Server is listening on port ${port}...`);
});
