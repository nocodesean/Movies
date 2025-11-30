import React, { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, Film, Loader2, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { saveMovie } from '../services/storage';
import { MovieMetadata } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState('Action, Drama, Comedy');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [rating, setRating] = useState('NR');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      setError("Please select a valid video file.");
      return;
    }
    setFile(selectedFile);
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    setTitle(baseName);
    setDescription('');
    setGenres('Action, Drama, Comedy');
    setYear(new Date().getFullYear().toString());
    setError(null);
  };

  const processUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      setProgressStep('Saving to Local Library (this may take a moment for large files)...');

      const movieRecord: MovieMetadata = {
        id: uuidv4(),
        originalFilename: file.name,
        fileSize: file.size,
        createdAt: Date.now(),
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        description: description || "No description available.",
        genre: genres.split(',').map((g) => g.trim()).filter(Boolean).length ? genres.split(',').map((g) => g.trim()).filter(Boolean) : ["Unsorted"],
        year: year || new Date().getFullYear().toString(),
        director: "Unknown",
        rating: rating || "NR"
      };

      await saveMovie(movieRecord, file);

      setProgressStep('Complete!');
      setTimeout(() => {
        onUploadComplete();
        resetForm();
      }, 1000);

    } catch (err) {
      console.error(err);
      setError("Failed to save the movie. Ensure you have enough storage space.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setIsProcessing(false);
    setProgressStep('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="text-red-600" />
            Upload to Library
          </h2>
          <button 
            onClick={resetForm}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col flex-1 overflow-y-auto">
          {!file ? (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 cursor-pointer transition-all duration-300
                ${isDragging ? 'border-red-500 bg-red-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
              `}
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Film className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-white mb-2">Drag and drop video files</p>
              <p className="text-sm text-gray-500">MKV, MP4, WEBM supported</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="video/*" 
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center text-red-500">
                  <Film className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={() => setFile(null)} 
                  disabled={isProcessing}
                  className="text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isProcessing ? (
                <div className="space-y-4 py-8">
                  <div className="flex flex-col items-center justify-center text-center gap-4">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    <div>
                      <p className="text-white font-medium text-lg">{progressStep}</p>
                      <p className="text-gray-500 text-sm mt-1">Please do not close this window</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-gray-400 mb-1">Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-gray-400 mb-1">Year</label>
                      <input
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-1">Genres / Tags (comma separated)</label>
                    <input
                      value={genres}
                      onChange={(e) => setGenres(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none min-h-[80px]"
                    />
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex gap-3 items-start">
                     <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                     <div className="text-sm text-blue-200">
                        <p className="font-semibold mb-1">Local Network Storage</p>
                        <p>Uploads are saved on the host machine running the app (Express server). Any device on the LAN using the host IP can stream these files.</p>
                     </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {file && !isProcessing && (
          <div className="p-6 border-t border-white/5 flex justify-end gap-3">
            <button 
              onClick={resetForm}
              className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={processUpload}
              className="px-6 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
            >
              Upload Movie
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
