import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { historyPayload } = await req.json();

    // Agar frontend se data nahi aa raha ya arrays khali hain to fail handling
    if (!historyPayload || !Array.isArray(historyPayload)) {
      return NextResponse.json({ reply: "Bad Request: No messages received." }, { status: 400 });
    }

    // Send data directly to local Ollama instance
    const ollamaRes = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',           
        messages: historyPayload,
        stream: false,
        options: { 
          temperature: 0.7, 
          num_ctx: 8192 
        }
      }),
    });

    if (!ollamaRes.ok) {
      return NextResponse.json({ 
        reply: "Ollama server is not responding. Please make sure Ollama is running." 
      }, { status: 503 });
    }

    const data = await ollamaRes.json();
    const reply = data.message?.content || "AI Engine gave a blank response. Please re-try.";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ 
      reply: "Local network socket gateway failed to communicate. Is Ollama running?" 
    }, { status: 500 });
  }
}
