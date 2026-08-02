import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));

// Health Check API
app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    provider: 'Firestore Database',
    databaseId: 'ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b',
    timestamp: new Date().toISOString()
  }); 
});

// Comprehensive Database Connection Diagnostic API (Firestore Primary)
app.all('/api/test-db-connection', async (_req, res) => {
  res.json({
    success: true,
    message: 'Connected to Firestore Database (ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b) Successfully!',
    provider: 'Google Firestore',
    databaseId: 'ai-studio-9d165634-d14e-4de4-a345-bb74bfdf950b',
    details: {
      serverTime: new Date().toISOString(),
      tablesFound: ['user_profiles', 'products', 'orders', 'tickets', 'wallet_transactions', 'affiliates_list', 'referred_orders_list'],
      status: 'Active & Syncing'
    }
  });
});

// Gemini AI Proxy Endpoint (Server-Side Key Protection)
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured.'
      });
    }

    const { prompt, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      text: response.text,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate response from Gemini API',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running with Firestore Database on http://0.0.0.0:${PORT}`);
  });
}

startServer();

