import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Maximize, Minimize, Volume2, VolumeX, Play, Pause, Settings } from 'lucide-react';
import { getMovieFile } from '../services/storage';
import { MovieMetadata } from '../types';

interface PlayerProps {
  movie: MovieMetadata;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ movie, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const url = await getMovieFile(movie.id);
        setVideoUrl(url);
      } catch (err) {
        console.error(err);
        setError("Failed to load video stream.");
      } finally {
        setLoading(false);
      }
    };
    loadVideo();
  }, [movie.id]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center group"
      onMouseMove={handleMouseMove}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="text-center p-8 max-w-md">
          <p className="text-red-500 text-xl mb-4">Error</p>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-full font-bold">Go Back</button>
        </div>
      )}

      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          autoPlay
          controls={false}
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Custom UI Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300 flex flex-col justify-between pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Top Bar */}
        <div className="p-6 pointer-events-auto flex items-center justify-between">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-medium text-lg tracking-wide drop-shadow-md">{movie.title}</span>
          </button>
          
          <div className="px-3 py-1 bg-white/10 backdrop-blur rounded text-xs font-bold uppercase tracking-widest text-white/90 border border-white/10">
            LAN Source
          </div>
        </div>

        {/* Center Play Button (only when paused) */}
        {!isPlaying && !loading && !error && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <button 
              onClick={togglePlay}
              className="w-20 h-20 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-105 shadow-2xl"
            >
              <Play className="w-8 h-8 ml-1" />
            </button>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="p-6 pointer-events-auto space-y-4">
          <div className="flex items-center justify-between text-white/90">
             <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="hover:text-red-500 transition-colors">
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
                <div className="text-sm font-medium">
                  {movie.year} | {movie.genre[0]} | {movie.rating}
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <button className="hover:text-white text-white/70">
                  <Volume2 className="w-6 h-6" />
                </button>
                <button className="hover:text-white text-white/70">
                  <Maximize className="w-6 h-6" />
                </button>
             </div>
          </div>
          
          {/* Progress Bar (Visual Only for this demo) */}
          <div className="h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group/progress">
            <div className="w-1/3 h-full bg-red-600 relative group-hover/progress:bg-red-500">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-lg scale-0 group-hover/progress:scale-100 transition-all"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
