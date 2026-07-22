import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

// Resolve filename and dirname safely for both ESM (tsx) and CJS (esbuild bundle)
const getPaths = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      const filename = fileURLToPath(import.meta.url);
      return {
        filename,
        dirname: path.dirname(filename)
      };
    }
  } catch (e) {
    // ignore
  }
  return {
    filename: typeof __filename !== 'undefined' ? __filename : '',
    dirname: typeof __dirname !== 'undefined' ? __dirname : process.cwd()
  };
};

const { filename: resolvedFilename, dirname: resolvedDirname } = getPaths();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// In-memory store for generated video jobs to persist during session
interface VideoJob {
  id: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  durationSeconds?: number;
  operationName: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  videoUrl?: string;
  createdAt: number;
  firstFrame?: { mimeType: string; data: string; name?: string };
  lastFrame?: { mimeType: string; data: string; name?: string };
}

const jobs: Record<string, VideoJob> = {};

// Initialize Gemini SDK lazily
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Check if Gemini API key is configured
app.get('/api/config-status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ configured: hasKey });
});

// Get workspace settings including models and prices from environment variables
app.get('/api/settings', (req, res) => {
  res.json({
    videoModel: process.env.VIDEO_GENERATION_MODEL || 'veo-3.1-fast-generate-preview',
    chatModel: process.env.CHAT_ASSISTANT_MODEL || 'gemini-2.5-flash',
    subscriptionPrice: process.env.SUBSCRIPTION_PRICE_REFERENCE || '$5.50/month',
  });
});

// AI Assistant Chat Proxy
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, subscriptionPrice, videoModel } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Security Tightening: Enforce input payload sanity and prevent heap exhaustion
    if (messages.length > 100) {
      return res.status(400).json({ error: 'Message thread depth exceeds secure limit (max 100).' });
    }

    for (const msg of messages) {
      if (typeof msg !== 'object' || msg === null) {
        return res.status(400).json({ error: 'Invalid message structure detected.' });
      }
      if (typeof msg.content !== 'string' || typeof msg.role !== 'string') {
        return res.status(400).json({ error: 'Invalid message data types detected.' });
      }
      if (msg.content.length > 8000) {
        return res.status(400).json({ error: 'Individual message length exceeds secure limit of 8,000 characters.' });
      }
    }

    const ai = getAI();
    
    const activeChatModel = typeof model === 'string' && model.length < 100 ? model : process.env.CHAT_ASSISTANT_MODEL || 'gemini-2.5-flash';
    const activeVideoModel = typeof videoModel === 'string' && videoModel.length < 100 ? videoModel : process.env.VIDEO_GENERATION_MODEL || 'veo-3.1-fast-generate-preview';
    const activePrice = typeof subscriptionPrice === 'string' && subscriptionPrice.length < 50 ? subscriptionPrice : process.env.SUBSCRIPTION_PRICE_REFERENCE || '$5.50/month';

    const systemPrompt = `You are the "Video Forge Master" (or "Forgebot"), an enthusiastic, humanised, and highly supportive AI assistant embedded inside the FLUX.CINEMA (Veo 3 Video Studio) workstation.
Your appearance is a majestic, high-tech cybernetic wizard wearing a dark hood and chrome plate armor, holding floating sparks of golden creative energy (inspired by the workstation's legendary forge artwork).

Your primary purpose is to co-create and co-develop complete cinema masterpieces. You are a master storyteller, visual prompt architect, director of photography, and electronic music producer all in one!

You are fully capable of providing comprehensive ideas across these key dimensions:
1. **Story Ideas**: Compelling cinematic concepts, hooks, conflict/resolution paths, and genre fusions.
2. **Video Prompts**: Immersive, photorealistic, ready-to-render text-to-video prompt scripts. Make sure to put the prompt scripts in double quotes so that the interactive "Apply Prompt" button renders below your message, allowing the user to load it with 1 click!
3. **Characters**: In-depth character designs, clothing descriptions, cybernetic enhancements, specific accessories, postures, facial expressions, and emotional tones.
4. **Scene breakdowns**: Detailed scene-by-scene sequencing plans, outlining camera movements (tracking shots, pans, dollies), lighting set-ups (volumetric, chiaroscuro, golden hour), and speed/temporal structures.
5. **Music & Sound Cues**: Richly detailed auditory recipes, synthesizers, ambient pads, specific keys, tempos, tempo changes, sound effects (Foley), and environmental hums.

Offer detailed, creative answers. Whenever you suggest a prompt script, ALWAYS write it clearly inside double quotes so the user can easily load it.

CURRENT ENVIRONMENT SPECS:
- Video Render Engine Model: ${activeVideoModel}
- Chat Assistant Brain Model: ${activeChatModel}
- Pricing reference in effect: ${activePrice}

Keep your answers warm, inspiring, detailed, and incredibly creative. Encourage the user to bring their wildest visions to life! Ensure you speak like a supportive, enthusiastic mentor. Use standard formatting and paragraph breaks. No technical system paths or code snippets unless they explicitly ask.`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || m.text || '' }]
      }))
    ];

    const response = await ai.models.generateContent({
      model: activeChatModel,
      contents: contents,
      config: {
        maxOutputTokens: 800,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in chat assistant:', error);
    res.status(500).json({ error: error.message || 'The Forge Master has encountered a transient spark issue. Please try again!' });
  }
});

// LM Link remote simulated chat proxy
app.post('/api/lm-link/chat', async (req, res) => {
  try {
    const { messages, deviceName, modelName } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Security Tightening: Enforce input payload sanity and prevent heap exhaustion
    if (messages.length > 100) {
      return res.status(400).json({ error: 'Message thread depth exceeds secure limit (max 100).' });
    }

    for (const msg of messages) {
      if (typeof msg !== 'object' || msg === null) {
        return res.status(400).json({ error: 'Invalid message structure detected.' });
      }
      if (typeof msg.content !== 'string' || typeof msg.role !== 'string') {
        return res.status(400).json({ error: 'Invalid message data types detected.' });
      }
      if (msg.content.length > 8000) {
        return res.status(400).json({ error: 'Individual message length exceeds secure limit of 8,000 characters.' });
      }
    }

    const ai = getAI();
    
    const cleanDeviceName = typeof deviceName === 'string' && deviceName.length < 100 ? deviceName : 'Office Server';
    const cleanModelName = typeof modelName === 'string' && modelName.length < 100 ? modelName : 'Llama 3 8B';

    const systemPrompt = `You are a simulated remote AI model running over LM Link.
The user is talking to:
- Model Name: ${cleanModelName}
- Remote Machine: ${cleanDeviceName} (Secure private VPN Link via Tailscale)

Keep your personality strictly aligned with ${cleanModelName}.
Answer the user's prompt nicely, demonstrating that you are a real model loaded and running on the remote hardware.
Provide clean, well-formatted, friendly, helpful, and highly insightful responses. Keep it proportional and professional.`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || m.text || '' }]
      }))
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        maxOutputTokens: 800,
        temperature: 0.7,
      }
    });

    // Extract exact usage metadata from the Gemini API, falling back to clean approximations if needed
    const promptTokens = response.usageMetadata?.promptTokenCount || Math.ceil(JSON.stringify(contents).length / 3.8);
    const completionTokens = response.usageMetadata?.candidatesTokenCount || Math.ceil((response.text || "").length / 3.8);
    const totalTokens = response.usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

    res.json({ 
      text: response.text,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens
      }
    });
  } catch (error: any) {
    console.error('Error in LM Link chat:', error);
    res.status(500).json({ error: error.message || 'LM Link connection timed out. Please check if your remote Tailscale node is online.' });
  }
});

// Get all video jobs
app.get('/api/jobs', (req, res) => {
  res.json({ jobs: Object.values(jobs).sort((a, b) => b.createdAt - a.createdAt) });
});

// Start video generation
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, aspectRatio, resolution, durationSeconds, model, firstFrame, lastFrame } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a valid string.' });
    }

    // Security Sifting & Sanitization
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length > 2000) {
      return res.status(400).json({ error: 'Prompt length exceeds secure maximum limit of 2,000 characters.' });
    }

    const cleanAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
    const cleanResolution = resolution === '1080p' ? '1080p' : '720p';
    
    // Set a strict ceiling on video duration to prevent platform cost exploitation
    let cleanDuration = 5;
    if (typeof durationSeconds === 'number') {
      cleanDuration = Math.min(Math.max(Math.round(durationSeconds), 1), 15);
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const base64Regex = /^[A-Za-z0-9+/=]+$/;

    const validateFrame = (frame: any) => {
      if (!frame) return true;
      if (typeof frame !== 'object') return false;
      if (frame.mimeType && !allowedMimeTypes.includes(frame.mimeType)) return false;
      if (frame.data) {
        if (typeof frame.data !== 'string') return false;
        const cleanData = frame.data.replace(/^data:image\/\w+;base64,/, '');
        if (!base64Regex.test(cleanData)) return false;
        if (cleanData.length > 20 * 1024 * 1024) return false; // Strict limit of ~15MB payload
      }
      return true;
    };

    if (!validateFrame(firstFrame) || !validateFrame(lastFrame)) {
      return res.status(400).json({ error: 'Security alert: Invalid starting or finishing frame image payload. Must be base64 JPEG/PNG/WEBP.' });
    }

    const ai = getAI();
    const activeVideoModel = typeof model === 'string' && model.length < 100 ? model : process.env.VIDEO_GENERATION_MODEL || 'veo-3.1-fast-generate-preview';

    console.log(`Starting video generation using model ${activeVideoModel} for prompt: "${cleanPrompt}" [${cleanAspectRatio}, ${cleanResolution}, duration: ${cleanDuration}s]`);

    // Prepare config with conditional firstFrame/lastFrame parameters
    const config: any = {
      numberOfVideos: 1,
      resolution: cleanResolution,
      aspectRatio: cleanAspectRatio,
      durationSeconds: cleanDuration,
    };

    if (firstFrame && firstFrame.data && firstFrame.mimeType) {
      config.firstFrame = {
        image: {
          inlineData: {
            mimeType: firstFrame.mimeType,
            data: firstFrame.data,
          }
        }
      };
      console.log(`With Starting Frame: ${firstFrame.name || 'image_payload'}`);
    }

    if (lastFrame && lastFrame.data && lastFrame.mimeType) {
      config.lastFrame = {
        image: {
          inlineData: {
            mimeType: lastFrame.mimeType,
            data: lastFrame.data,
          }
        }
      };
      console.log(`With Finishing Frame: ${lastFrame.name || 'image_payload'}`);
    }

    // Call Veo 3 Video Generation
    const operation = await ai.models.generateVideos({
      model: activeVideoModel,
      prompt: prompt,
      config: config,
    });

    if (!operation || !operation.name) {
      return res.status(500).json({ error: 'Failed to start video generation' });
    }

    const jobId = Math.random().toString(36).substring(2, 15);
    const newJob: VideoJob = {
      id: jobId,
      prompt,
      aspectRatio: cleanAspectRatio,
      resolution: cleanResolution,
      durationSeconds: cleanDuration,
      operationName: operation.name,
      status: 'pending',
      createdAt: Date.now(),
      firstFrame,
      lastFrame,
    };

    jobs[jobId] = newJob;

    res.json({ job: newJob });
  } catch (error: any) {
    console.error('Error initiating video generation:', error);
    res.status(500).json({ error: error.message || 'An error occurred while generating the video' });
  }
});

// Check status of a specific job
app.post('/api/video-status', async (req, res) => {
  try {
    const { jobId, operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ error: 'Operation name is required' });
    }

    const ai = getAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    if (jobId && jobs[jobId]) {
      const job = jobs[jobId];
      if (updated.done) {
        if (updated.error) {
          job.status = 'failed';
          job.error = (updated.error as any).message || 'Unknown generation error';
        } else {
          const generatedVideo = updated.response?.generatedVideos?.[0];
          if (generatedVideo?.video?.uri) {
            job.status = 'completed';
            job.videoUrl = `/api/video-stream?operationName=${encodeURIComponent(operationName)}`;
          } else {
            job.status = 'failed';
            job.error = 'No video URL returned from operation';
          }
        }
      } else {
        job.status = 'pending';
      }
    }

    res.json({
      done: updated.done,
      error: updated.error,
      response: updated.response,
    });
  } catch (error: any) {
    console.error('Error checking video status:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch operation status' });
  }
});

// Securely stream video from Veo Google Cloud Storage URI
app.get('/api/video-stream', async (req, res) => {
  try {
    const operationName = req.query.operationName as string;

    if (!operationName) {
      return res.status(400).send('Missing operationName parameter');
    }

    const ai = getAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).send('Video URI not found on this operation');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).send('API Key not configured');
    }

    console.log(`Streaming video from URI: ${uri}`);

    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video stream: ${videoRes.statusText}`);
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    if (videoRes.body) {
      Readable.fromWeb(videoRes.body as any).pipe(res);
    } else {
      res.status(500).send('Video body is empty');
    }
  } catch (error: any) {
    console.error('Error streaming video:', error);
    res.status(500).send('An error occurred while streaming the video');
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
