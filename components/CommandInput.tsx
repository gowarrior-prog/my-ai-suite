"use client";
import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Mic, Plus, Paperclip, FileText as FileIcon, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FileMeta = {
  name: string;
  type: string;
  urlData: string;
};

type CommandInputProps = {
  onSendMessage: (text: string, base64Images: string[], fileMeta?: FileMeta, docContent?: string) => void;
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
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Load saved attachment
  useEffect(() => {
    const saved = localStorage.getItem("attachedFile");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAttachedFileName(data.name || "");
        setAttachedFileType(data.type || "");
        setRawFileUrlData(data.urlData || "");
        setDocumentContent(data.documentContent || "");
        setAttachedImages(data.attachedImages || []);
      } catch (e) {
        console.error("Failed to load saved attachment");
      }
    }
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };

    if (showAttachMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachMenu]);

  const saveToLocalStorage = () => {
    localStorage.setItem("attachedFile", JSON.stringify({
      name: attachedFileName,
      type: attachedFileType,
      urlData: rawFileUrlData,
      documentContent,
      attachedImages,
    }));
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('PDF extraction failed');

      const data = await response.json();
      return data.text || "[PDF content could not be extracted]";
    } catch (error) {
      console.error("PDF parsing error:", error);
      return "[PDF text extraction failed. Full file is still attached.]";
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

    const fileName = file.name;
    const fileType = file.type;

    setAttachedFileName(fileName);
    setAttachedFileType(fileType);
    setShowAttachMenu(false);

    try {
      const fullDataUrl = await readFileAsDataURL(file);
      setRawFileUrlData(fullDataUrl);

      const isImage = file.type.startsWith("image/");
      const isText = /\.(txt|md|json|csv)$/i.test(file.name);
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

      let content = "";
      let images: string[] = [];

      if (isImage) {
        const cleanBase64 = fullDataUrl.split(",")[1] || "";
        images = [cleanBase64];
        setAttachedImages(images);
        setDocumentContent("");
      } 
      else if (isText) {
        content = await file.text();
        setDocumentContent(content);
        setAttachedImages([]);
      } 
      else if (isPdf) {
        setIsParsingPdf(true);
        try {
          content = await extractTextFromPDF(file);
          setDocumentContent(content);
          setAttachedImages([]);
        } finally {
          setIsParsingPdf(false);
        }
      } 
      else {
        setDocumentContent("");
        setAttachedImages([]);
      }

      // Directly write fresh data to localStorage to avoid React state timing race conditions
      localStorage.setItem("attachedFile", JSON.stringify({
        name: fileName,
        type: fileType,
        urlData: fullDataUrl,
        documentContent: content,
        attachedImages: images,
      }));
    } catch (error) {
      console.error("File processing error:", error);
      alert("Failed to process the file");
      clearAttachment();
    }
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice input not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.start();
  };

  const handleTriggerSend = () => {
    if (loading || isRecording || isParsingPdf) return;

    const userText = input.trim();
    if (!userText && !documentContent && !attachedImages.length) return;

    let finalText = userText;

    const fileMeta = attachedFileName ? {
      name: attachedFileName,
      type: attachedFileType,
      urlData: rawFileUrlData
    } : undefined;

    onSendMessage(finalText, attachedImages, fileMeta, documentContent);
    
    // Clear after sending
    clearAttachment();
    setInput("");
  };

  return (
    <div className="relative p-4 md:p-6 pb-6 w-full max-w-4xl mx-auto z-40">
      {/* Attached File Indicator */}
      <AnimatePresence>
        {attachedFileName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-11 left-6 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm"
          >
            {attachedImages.length > 0 ? <ImageIcon size={16} className="text-cyan-400" /> : <FileIcon size={16} className="text-indigo-400" />}
            <span className="truncate max-w-[180px] text-white/90">{attachedFileName}</span>
            <button onClick={clearAttachment} className="ml-1 text-red-400 hover:text-red-500">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 focus-within:border-cyan-500/50 rounded-3xl p-2 shadow-2xl transition-all">
        
        {/* Attach Button */}
        <div className="relative" ref={attachMenuRef}>
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-3 rounded-full transition-all ${showAttachMenu ? "bg-cyan-500 text-black rotate-45" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
            type="button"
          >
            <Plus size={20} />
          </button>

          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full mb-2 bg-[#1A1D24] border border-white/10 rounded-2xl p-2 shadow-xl w-56 z-50"
              >
                <button onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-xl text-left">
                  <Paperclip size={18} className="text-indigo-400" /> Document / PDF
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-xl text-left">
                  <ImageIcon size={18} className="text-cyan-400" /> Image
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTriggerSend()}
          placeholder={isParsingPdf ? "Processing PDF..." : "Type your message..."}
          disabled={loading || isParsingPdf}
          className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
        />

        <button onClick={toggleVoiceRecording} className={`p-3 rounded-full ${isRecording ? "text-red-400 animate-pulse" : "text-gray-400 hover:text-white"}`} type="button">
          <Mic size={20} />
        </button>

        <button
          onClick={handleTriggerSend}
          disabled={loading || isParsingPdf || (!input.trim() && !documentContent && !attachedImages.length)}
          className="ml-2 p-3 bg-gradient-to-r from-cyan-500 to-blue-500 disabled:from-gray-600 text-black rounded-full transition-all min-w-[48px] min-h-[48px] flex items-center justify-center"
          type="button"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <SendHorizontal size={20} />
          )}
        </button>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md,.json,.png,.jpg,.jpeg" />
    </div>
  );
}