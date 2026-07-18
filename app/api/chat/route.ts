import { NextResponse } from 'next/server';

// Set this in your .env.local file:
// GEMINI_API_KEY=your_key_here
// Get a key from: https://aistudio.google.com/app/apikey

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash-lite'; // fast, cheap, multimodal (text/image/video/audio/pdf)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Convert your internal message format -> Gemini's "contents" format
function toGeminiContents(historyPayload: any[]) {
  return historyPayload.map((msg: any) => {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [];

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    if (Array.isArray(msg.images) && msg.images.length > 0) {
      for (const img of msg.images) {
        // img is expected to be a base64 string (no data: prefix) or
        // { data: base64, mimeType: 'image/png' }
        const base64Data = typeof img === 'string' ? img : img.data;
        const mimeType = typeof img === 'string' ? 'image/png' : (img.mimeType || 'image/png');
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data,
          },
        });
      }
    }

    return { role, parts };
  });
}

export async function POST(req: Request) {
  try {
    const { historyPayload } = await req.json();

    // Validation
    if (!historyPayload || !Array.isArray(historyPayload) || historyPayload.length === 0) {
      return NextResponse.json(
        { reply: "Bad Request: No messages received." },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        reply: "GEMINI_API_KEY set nahi hai. .env.local file mein add karein."
      });
    }

    const hasImages = historyPayload.some(
      (msg: any) => Array.isArray(msg.images) && msg.images.length > 0
    );

    const contents = toGeminiContents(historyPayload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for vision tasks

    let geminiRes;
    try {
      geminiRes = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.75,
            topP: 0.9,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json({
          reply: "Request timed out. Chota message ya document ke sath dobara try karein."
        });
      }
      return NextResponse.json({
        reply: "Google Gemini API tak nahi pahunch saka. Internet connection aur API key check karein."
      });
    }

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text().catch(() => "Unknown error");
      console.error("Gemini Error:", errorText);

      if (geminiRes.status === 429) {
        return NextResponse.json({
          reply: "Gemini API ki quota/rate limit khatam ho gayi hai. Thora ruk kar dobara try karein, ya https://aistudio.google.com/app/apikey par apni quota check karein."
        });
      }

      if (geminiRes.status === 404) {
        return NextResponse.json({
          reply: `Model "${GEMINI_MODEL}" nahi mila. Google AI Studio mein model list check karein ya naya model name use karein.`
        });
      }

      if (hasImages && geminiRes.status === 400) {
        return NextResponse.json({
          reply: "Image analysis fail hui. Check karein images valid base64 hain aur size limit ke andar hain."
        });
      }

      return NextResponse.json({
        reply: `Gemini API ne error ${geminiRes.status} diya. Server logs check karein.`
      });
    }

    const data = await geminiRes.json();

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Sorry, response generate nahi ho saka. Dobara try karein.";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({
      reply: "Kuch masla ho gaya AI se connect karte waqt."
    });
  }
}