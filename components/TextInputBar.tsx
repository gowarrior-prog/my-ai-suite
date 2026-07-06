"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal, Mic } from "lucide-react";

type FileMeta = {
  name: string;
  type: string;
  urlData: string;
};

type TextInputBarProps = {
  loading: boolean;
  disabled?: boolean;
  documentContent: string;
  attachedImages: string[];
  attachedFileMeta?: FileMeta | null;
  onSendMessage: (
    text: string,
    base64Images: string[],
    fileMeta?: FileMeta
  ) => void;
};

export default function TextInputBar({
  loading,
  disabled = false,
  documentContent,
  attachedImages,
  attachedFileMeta,
  onSendMessage,
}: TextInputBarProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Browser does not support voice typing.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.onresult = (event: any) => {
      const voiceResult = event.results?.[0]?.[0]?.transcript || "";
      if (voiceResult) {
        setInput((prev) => (prev ? `${prev} ${voiceResult}` : voiceResult));
      }
    };

    recognition.start();
  };

  const handleSend = () => {
    if (loading || disabled || isRecording) return;

    const userPromptText = input.trim();
    if (!userPromptText && !documentContent && !attachedImages.length) return;

    let finalPromptPayload = userPromptText;

    if (documentContent) {
      finalPromptPayload = userPromptText
        ? `${userPromptText}\n\n---\n[ATTACHED DOCUMENT]\n${documentContent}`
        : `Analyze the attached document and give a detailed response.\n\n[ATTACHED DOCUMENT]\n${documentContent}`;
    }

    onSendMessage(finalPromptPayload, attachedImages, attachedFileMeta || undefined);
    setInput("");
  };

  return (
    <div className="relative flex items-center bg-[#13171e]/90 border border-white/[0.05] group-focus-within:border-cyan-500/40 rounded-full pl-5 pr-2 py-1.5 transition-all shadow-xl">
      <input
        type="text"
        className="flex-1 bg-transparent px-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none"
        placeholder="Prompt Neuro Core..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        disabled={loading || disabled || isRecording}
      />

      <button
        onClick={toggleVoiceRecording}
        className={`p-1.5 transition-all rounded-full relative ${
          isRecording
            ? "text-red-400 bg-red-500/10 animate-pulse"
            : "text-gray-500 hover:text-gray-300"
        }`}
        type="button"
      >
        <Mic size={15} />
      </button>

      <button
        onClick={handleSend}
        disabled={
          (!input.trim() && !documentContent && !attachedImages.length) ||
          loading ||
          disabled ||
          isRecording
        }
        className="p-2.5 bg-cyan-400 hover:bg-cyan-300 text-[#050709] rounded-full disabled:opacity-30 transition-all shadow-md"
        type="button"
      >
        <SendHorizontal size={14} className="stroke-[2.5]" />
      </button>
    </div>
  );
}