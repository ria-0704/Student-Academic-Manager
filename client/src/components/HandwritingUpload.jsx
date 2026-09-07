/**
 * HandwritingUpload.jsx
 *
 * Isolated component for the handwritten-answer OCR flow.
 * Handles: image selection → preview → server-side OCR → text confirmation.
 *
 * Props:
 *   onExtracted(text)  — called when OCR succeeds; parent should call setAnswer(text)
 *   onError(message)   — called on validation or network errors
 *
 * This component is intentionally self-contained.
 * Removing it (and the one import in MockPractice) fully disables the feature.
 */

import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Loader2, CheckCircle2, RefreshCw, ImageIcon } from 'lucide-react';
import api from '../services/api';

const ACCEPTED_FORMATS = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const MAX_SIZE_BYTES   = 10 * 1024 * 1024; // 10 MB

export default function HandwritingUpload({ onExtracted, onError }) {
  const fileInputRef = useRef(null);

  const [imageFile,     setImageFile]     = useState(null);   // File object
  const [previewUrl,    setPreviewUrl]    = useState(null);   // Object URL for <img>
  const [extracting,    setExtracting]    = useState(false);  // OCR in progress
  const [extractedText, setExtractedText] = useState('');     // Raw OCR output
  const [confirmed,     setConfirmed]     = useState(false);  // Student has confirmed/edited

  // ── Helpers ───────────────────────────────────────────────────────────────

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    setExtractedText('');
    setConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validateFile(file) {
    if (!file) return 'No file selected.';
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowed.includes(file.type)) {
      return 'Please upload a JPG, PNG, or WebP image of your handwritten answer.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`;
    }
    if (file.size === 0) {
      return 'The selected file appears to be empty.';
    }
    return null; // valid
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    clearImage();           // clean up any previous selection
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleExtract() {
    if (!imageFile) {
      onError('Please select an image first.');
      return;
    }

    setExtracting(true);
    setExtractedText('');
    setConfirmed(false);

    try {
      const formData = new FormData();
      formData.append('handwriting', imageFile);

      const response = await api.post('/mock/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // OCR can take time on large/complex images
      });

      const text = response.data.extracted_text || '';

      if (!text.trim()) {
        onError('No text could be read from the image. Please ensure the handwriting is clear and the image is well-lit.');
        return;
      }

      setExtractedText(text);
    } catch (err) {
      const message = err.response?.data?.message
        || err.userMessage
        || 'Handwriting extraction failed. Please try again or type your answer manually.';
      onError(message);
    } finally {
      setExtracting(false);
    }
  }

  function handleConfirm() {
    const finalText = extractedText.trim();
    if (!finalText) {
      onError('Extracted text is empty. Please re-upload or type your answer.');
      return;
    }
    setConfirmed(true);
    onExtracted(finalText);
  }

  function handleReExtract() {
    setExtractedText('');
    setConfirmed(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Phase 1: No image selected ─────────────────────────────────── */}
      {!imageFile && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload handwritten answer image"
        >
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-1">
            Click to upload or drag an image
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG, WebP or HEIC · Max 10 MB
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Take a photo of your handwritten answer on paper
          </p>
        </div>
      )}

      {/* Hidden file input — also accepts camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        capture="environment"   // on mobile, opens camera by default
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* ── Phase 2: Image selected → show preview ──────────────────────── */}
      {imageFile && !extractedText && (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={previewUrl}
              alt="Handwritten answer preview"
              className="w-full max-h-72 object-contain"
            />
            {/* Remove button */}
            <button
              onClick={clearImage}
              disabled={extracting}
              className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-red-500 transition disabled:opacity-50"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File info */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="truncate max-w-[70%]">{imageFile.name}</span>
            <span>{(imageFile.size / 1024).toFixed(0)} KB</span>
          </div>

          {/* Extract button */}
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="btn-primary w-full"
          >
            {extracting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting handwriting…</>
              : <><Upload className="w-4 h-4" /> Extract Answer</>
            }
          </button>

          {extracting && (
            <p className="text-xs text-gray-400 text-center">
              AI is reading your handwriting — this usually takes 5–15 seconds
            </p>
          )}
        </div>
      )}

      {/* ── Phase 3: OCR done → show extracted text for confirmation ──── */}
      {extractedText && !confirmed && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Extracted text — review and edit if needed
            </h4>
            <button
              onClick={handleReExtract}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Re-extract
            </button>
          </div>

          {/* Editable textarea so student can correct OCR mistakes */}
          <textarea
            value={extractedText}
            onChange={e => setExtractedText(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-xl p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            aria-label="Extracted handwriting text — edit if needed"
          />

          <p className="text-xs text-gray-400">
            Words marked <span className="font-mono text-gray-600">[UNCLEAR]</span> were unreadable.
            You can correct them before confirming.
          </p>

          <div className="flex gap-3">
            <button onClick={clearImage} className="btn-secondary flex-1">
              Upload Different Image
            </button>
            <button
              onClick={handleConfirm}
              disabled={!extractedText.trim()}
              className="btn-primary flex-1"
            >
              <CheckCircle2 className="w-4 h-4" /> Use This Answer
            </button>
          </div>
        </div>
      )}

      {/* ── Phase 4: Confirmed — compact summary ────────────────────────── */}
      {confirmed && (
        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">
              Handwritten answer loaded
            </p>
            <p className="text-xs text-green-600 mt-0.5 line-clamp-2">
              {extractedText.substring(0, 120)}{extractedText.length > 120 ? '…' : ''}
            </p>
          </div>
          <button
            onClick={() => { setConfirmed(false); }}
            className="text-xs text-green-600 hover:text-green-800 shrink-0 underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}