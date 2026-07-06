"use client";
import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Mic, Plus, Paperclip, FileText as FileIcon, X, Image as ImageIcon } from "lucide-react";

type FileMeta = {
  name: string;
  type: string;
  urlData: string;
};

type CommandInputProps = {
  onSendMessage: (text: string, base64Images: string[], fileMeta?: FileMeta) => void;
  loading: boolean;
};

export default function CommandInput({ onSendMessage, loading }: CommandInputProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedFileName, setAttachedFileName] = useState("");
  const [attachedFileType, setAttachedFileType] = useState("");
  const [rawFileUrlData, setRawFileUrlData] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist attachment
  useEffect(() => {
    const saved = localStorage.getItem("attachedFile");
    if (saved) {
      const data = JSON.parse(saved);
      setAttachedFileName(data.name || "");
      setAttachedFileType(data.type || "");
      setRawFileUrlData(data.urlData || "");
      setDocumentContent(data.documentContent || "");
      setAttachedImages(data.attachedImages || []);
    }
  }, []);

  const saveToLocalStorage = () => {
    if (attachedFileName) {
      localStorage.setItem("attachedFile", JSON.stringify({
        name: attachedFileName,
        type: attachedFileType,
        urlData: rawFileUrlData,
        documentContent,
        attachedImages,
      }));
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
    });
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str || "").join(" ");
        fullText += pageText + "\n";
      }
      return fullText.trim();
    } catch (error) {
      console.error("PDF parsing error:", error);
      return "[PDF text extraction failed. The full file is attached for analysis.]";
    }
  };

  const clearAttachment = () => {
    setAttachedImages([]);
    setAttachedFileName("");
    setAttachedFileType("");
    setRawFileUrlData("");
    setDocumentContent("");
    setIsParsingPdf(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    localStorage.removeItem("attachedFile");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFileName(file.name);
    setAttachedFileType(file.type || "application/octet-stream");
    setShowAttachMenu(false);

    try {
      const fullDataUrl = await readFileAsDataURL(file);
      setRawFileUrlData(fullDataUrl);

      const isImage = file.type.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name);
      const isText = file.type.startsWith("text/") || /\.(txt|json|md|csv)$/i.test(file.name);
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

      if (isImage) {
        const cleanBase64 = fullDataUrl.split(",")[1] || "";
        setAttachedImages([cleanBase64]);
        setDocumentContent("");
      } else if (isText) {
        const textContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(String(e.target?.result));
          reader.readAsText(file);
        });
        setDocumentContent(textContent);
        setAttachedImages([]);
      } else if (isPdf) {
        setIsParsingPdf(true);
        setInput("Processing PDF...");

        const extractedText = await extractTextFromPDF(file);
        setDocumentContent(extractedText);
        setAttachedImages([]);
        setInput("");
        setIsParsingPdf(false);
      } else {
        setDocumentContent("");
        setAttachedImages([]);
      }

      saveToLocalStorage();
    } catch (error) {
      console.error("File attachment error:", error);
      alert("Failed to process file");
      clearAttachment();
    }
  };

  const toggleVoiceRecording = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Browser does not support voice typing.");
      return;
    }

    if (isRecording) {
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const voiceResult = event.results?.[0]?.[0]?.transcript || "";
      if (voiceResult) {
        setInput((prev) => (prev ? `${prev} ${voiceResult}` : voiceResult));
      }
    };

    recognition.start();
  };

  const handleTriggerSend = () => {
    if (loading || isRecording || isParsingPdf) return;

    const userPromptText = input.trim();
    if (!userPromptText && !documentContent && !attachedImages.length) return;

    let finalPromptPayload = userPromptText;

    if (documentContent) {
      finalPromptPayload = userPromptText
        ? `${userPromptText}\n\n---\n[ATTACHED DOCUMENT]\n${documentContent}`
        : `Analyze the attached document and give a detailed response.\n\n${documentContent}`;
    }

    const fileMetaPayload = attachedFileName && rawFileUrlData
      ? { name: attachedFileName, type: attachedFileType, urlData: rawFileUrlData }
      : undefined;

    onSendMessage(finalPromptPayload, attachedImages, fileMetaPayload);
    clearAttachment();
    setInput("");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#050709] via-[#050709] to-transparent p-3 md:p-4 z-50 border-t border-white/10">
      <div className="max-w-3xl mx-auto">
        {/* Attached File Badge */}
        {attachedFileName && (
          <div className="flex items-center gap-2 bg-[#11151d] border border-cyan-500/20 px-3 py-1.5 rounded-xl mb-2 w-max mx-auto md:mx-0">
            {attachedImages.length > 0 ? <ImageIcon size={12} className="text-cyan-400" /> : <FileIcon size={12} className="text-purple-400" />}
            <span className="text-[11px] font-mono text-gray-300 max-w-[200px] truncate">
              {isParsingPdf ? "Extracting..." : attachedFileName}
            </span>
            <button onClick={() => clearAttachment()} className="text-gray-500 hover:text-red-400 p-0.5" type="button">
              <X size={12} />
            </button>
          </div>
        )}

        <div className="relative flex items-center bg-[#13171e]/95 border border-white/[0.08] focus-within:border-cyan-500/50 rounded-2xl pl-4 pr-2 py-2 md:py-3 shadow-2xl">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-xl hover:bg-white/5 transition-colors ${showAttachMenu ? "bg-white/10 text-cyan-400" : "text-gray-400"}`}
            type="button"
          >
            <Plus size={20} className={`transition-transform ${showAttachMenu ? "rotate-45" : ""}`} />
          </button>

          <input
            type="text"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none min-w-0"
            placeholder={isParsingPdf ? "Processing document..." : "Message Neuro Core..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTriggerSend()}
            disabled={isRecording || isParsingPdf}
          />

          <button
            onClick={toggleVoiceRecording}
            className={`p-2 rounded-xl transition-all ${isRecording ? "text-red-400 bg-red-500/10" : "text-gray-400 hover:text-white"}`}
            type="button"
          >
            <Mic size={20} />
          </button>

          <button
            onClick={handleTriggerSend}
            disabled={(!input.trim() && !documentContent && !attachedImages.length) || loading || isRecording || isParsingPdf}
            className="ml-1 p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 text-black rounded-xl transition-all disabled:opacity-50"
            type="button"
          >
            <SendHorizontal size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Attach Menu */}
        {showAttachMenu && (
          <div className="absolute bottom-16 left-4 bg-[#0F1217] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl w-full text-left" type="button">
              <Paperclip size={18} className="text-cyan-400" /> Document / PDF
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 rounded-xl w-full text-left" type="button">
              <ImageIcon size={18} className="text-purple-400" /> Image
            </button>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.json,.md,.png,.jpg,.jpeg" />
      </div>
    </div>
  );
}