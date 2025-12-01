import React, { useRef } from 'react';
import { Download, Trash2, UploadCloud } from 'lucide-react';
import { PrintMetadata } from '../types';
import { getPrintDownloadUrl } from '../services/storage';

interface PrintsPanelProps {
  prints: PrintMetadata[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

export const PrintsPanel: React.FC<PrintsPanelProps> = ({ prints, onUpload, onDelete, loading }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFilePick = () => inputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">3D Printing</h2>
          <p className="text-gray-400 text-sm">
            {prints.length} {prints.length === 1 ? 'file' : 'files'} available for download
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".stl,.gcode,.zip,.3mf,.obj"
          />
          <button
            onClick={handleFilePick}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-medium hover:bg-red-700 transition-colors text-sm"
            disabled={loading}
          >
            <UploadCloud className="w-4 h-4" />
            Upload Print File
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prints.map((p) => (
            <div key={p.id} className="bg-[#161616] border border-white/10 rounded-xl p-4 shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white truncate">{p.originalFilename}</h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {formatSize(p.fileSize)} • {new Date(p.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={getPrintDownloadUrl(p.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </a>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-600/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {prints.length === 0 && !loading && (
            <div className="col-span-full text-center text-gray-400 bg-[#161616] border border-white/10 rounded-xl p-6">
              No print files yet. Upload an STL/G-code to share on the LAN.
            </div>
          )}
        </div>
      )}
    </section>
  );
};
