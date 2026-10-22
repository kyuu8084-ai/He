import express from "express";
import { createServer } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { setupSignalingServer } from "./SignalingServer";
import ytSearch from "yt-search";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Initialize Signaling Server (PeerJS + Socket.io)
  setupSignalingServer(httpServer, app);

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, history } = req.body;
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: "You are a helpful AI assistant for the StudyWithMe student community forum. You help answer questions about career orientation, scholarships, studying, and give advice. Respond in Vietnamese.",
        }
      });

      if (history && history.length > 0) {
        // Send history manually or just append to prompt.
        // Actually, the simplest is to just append the chat history to the prompt for a simple implementation, or properly format it.
        // For simplicity, we just send the single message in this request, but in a real chat we need history.
      }

      // Let's just use generateContent with history formatted in text if history exists
      let contents = "";
      if (history && history.length > 0) {
        history.forEach((msg) => {
          contents += msg.role === 'user' ? `User: ${msg.text}\n` : `AI: ${msg.text}\n`;
        });
      }
      contents += `User: ${prompt}\nAI: `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: "You are a helpful AI assistant for the StudyWithMe student community forum. You help answer questions about career orientation, scholarships, studying, and give advice. Respond in Vietnamese. Keep it concise.",
        }
      });

      res.json({ text: response.text });
    } catch (err) {
      console.error('Gemini error:', err);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  

  app.get("/api/youtube/suggest", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json({ suggestions: [] });
      }
      
      const response = await fetch(`http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      // data format is [query, [suggestions...]]
      res.json({ suggestions: data[1] || [] });
    } catch (err) {
      console.error("YouTube suggest error:", err);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.get("/api/youtube/search", async (req, res) => {

    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      const r: any = await ytSearch(query);
      const videos = r.videos.slice(0, 10).map(v => ({
        id: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        timestamp: v.timestamp,
        author: v.author.name,
      }));
      res.json({ videos });
    } catch (err) {
      console.error("YouTube search error:", err);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
