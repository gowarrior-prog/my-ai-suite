"use client";

import { useRef, useState } from "react";
import {
  Plus,
  Paperclip,
  FileText as FileIcon,
  X,
  Image as ImageIcon,
} from "lucide-react";
import PDFExtractionWorker from "./PDFExtractionWorker";

type FileMeta = {
  name: string;
  type: string;
  urlData: string;
};

type AttachmentState = {
  file: File | null;
  fileMeta: FileMeta | null;
  attachedImages: string[];
  documentContent: string;
  isParsingPdf: boolean;
};

type FileAttachmentManagerProps = {
  onAttachmentChange: (state: AttachmentState) => void;
  onClear: () => void;
};

export default function FileAttachmentManager({
  onAttachmentChange,
  onClear,
}: FileAttachmentManagerProps) {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [documentContent, setDocumentContent] = useState("");
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileKindRef = useRef<"image" | "document" | null>(null);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
    });
  };

  const saveState = (nextState: Partial<AttachmentState>) => {
    const merged: AttachmentState = {
      file,
      fileMeta,
      attachedImages,
      documentContent,
      isParsingPdf,
      ...nextState,
    };
    onAttachmentChange(merged);
  };

  const clearAttachment = () => {
    setFile(null);
    setFileMeta(null);
    setAttachedImages([]);
    setDocumentContent("");
    setIsParsingPdf(false);
    setShowAttachMenu(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear();
  };

  const openFilePicker = (kind: "image" | "document") => {
    selectedFileKindRef.current = kind;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFile = e.target.files?.[0];
    if (!pickedFile) return;

    setShowAttachMenu(false);
    setFile(pickedFile);

    try {
      const fullDataUrl = await readFileAsDataURL(pickedFile);
      const meta: FileMeta = {
        name: pickedFile.name,
        type: pickedFile.type || "application/octet-stream",
        urlData: fullDataUrl,
      };

      setFileMeta(meta);

      const isImage =
        pickedFile.type.startsWith("image/") ||
        /\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i.test(pickedFile.name);

      const isText =
        pickedFile.type.startsWith("text/") ||
        /\.(txt|json|md|csv)$/i.test(pickedFile.name);

      const isPdf =
        pickedFile.type === "application/pdf" || /\.pdf$/i.test(pickedFile.name);

      if (isImage) {
        const cleanBase64 = fullDataUrl.split(",")[1] || "";
        setAttachedImages([cleanBase64]);
        setDocumentContent("");
        saveState({
          file: pickedFile,
          fileMeta: meta,
          attachedImages: [cleanBase64],
          documentContent: "",
          isParsingPdf: false,
        });
      } else if (isText) {
        const textContent = await readFileAsText(pickedFile);
        setAttachedImages([]);
        setDocumentContent(textContent);
        saveState({
          file: pickedFile,
          fileMeta: meta,
          attachedImages: [],
          documentContent: textContent,
          isParsingPdf: false,
        });
      } else if (isPdf) {
        setAttachedImages([]);
        setDocumentContent("");
        setIsParsingPdf(true);
        saveState({
          file: pickedFile,
          fileMeta: meta,
          attachedImages: [],
          documentContent: "",
          isParsingPdf: true,
        });
      } else {
        setAttachedImages([]);
        setDocumentContent("");
        saveState({
          file: pickedFile,
          fileMeta: meta,
          attachedImages: [],
          documentContent: "",
          isParsingPdf: false,
        });
      }
    } catch (error) {
      console.error("File attachment error:", error);
      alert("Failed to process file");
      clearAttachment();
    }
  };

  const handlePdfExtracted = (text: string) => {
    setDocumentContent(text);
    setIsParsingPdf(false);
    saveState({
      file,
      fileMeta,
      attachedImages,
      documentContent: text,
      isParsingPdf: false,
    });
  };

  const handlePdfError = (message: string) => {
    setDocumentContent(message);
    setIsParsingPdf(false);
    saveState({
      file,
      fileMeta,
      attachedImages,
      documentContent: message,
      isParsingPdf: false,
    });
  };

  return (
    <>
      {fileMeta && (
        <div className="flex items-center gap-2 bg-[#11151d] border border-cyan-500/20 px-3 py-1.5 rounded-xl w-max">
          {attachedImages.length > 0 ? (
            <ImageIcon size={12} className="text-cyan-400" />
          ) : (
            <FileIcon size={12} className="text-purple-400" />
          )}

          <span className="text-[11px] font-mono text-gray-300 max-w-[220px] truncate">
            {isParsingPdf ? "Extracting text..." : fileMeta.name}
          </span>

          <button
            onClick={clearAttachment}
            className="text-gray-500 hover:text-red-400 p-0.5 transition-colors"
            type="button"
            aria-label="Remove attachment"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {showAttachMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAttachMenu(false)}
          />
          <div className="absolute left-4 bottom-16 bg-[#0F1217] border border-white/5 p-2 rounded-2xl flex flex-col gap-1 shadow-2xl z-50">
            <button
              onClick={() => openFilePicker("document")}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/[0.02] rounded-xl w-full text-left"
              type="button"
            >
              <Paperclip size={14} className="text-cyan-400" />
              Upload Document / PDF
            </button>

            <button
              onClick={() => openFilePicker("image")}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/[0.02] rounded-xl w-full text-left"
              type="button"
            >
              <ImageIcon size={14} className="text-purple-400" />
              Upload Image
            </button>
          </div>
        </>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.txt,.json,.md,.csv,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg"
      />

      <button
        onClick={() => setShowAttachMenu((prev) => !prev)}
        className={`text-gray-500 hover:text-gray-300 p-1.5 transition-colors rounded-full ${
          showAttachMenu ? "bg-white/5 text-cyan-400" : ""
        }`}
        type="button"
        aria-label="Open attachment menu"
      >
        <Plus
          size={16}
          className={`transition-transform duration-200 ${
            showAttachMenu ? "rotate-45 text-cyan-400" : ""
          }`}
        />
      </button>

      {file?.type === "application/pdf" && (
        <PDFExtractionWorker
          file={file}
          onExtracted={handlePdfExtracted}
          onError={handlePdfError}
          onStart={() => setIsParsingPdf(true)}
          onFinish={() => setIsParsingPdf(false)}
        />
      )}
    </>
  );
}