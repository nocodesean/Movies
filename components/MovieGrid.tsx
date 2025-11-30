import React from 'react';
import { Play, Trash2, Clock, Calendar, Star } from 'lucide-react';
import { MovieMetadata } from '../types';

interface MovieGridProps {
  movies: MovieMetadata[];
  onMovieSelect: (movie: MovieMetadata) => void;
  onDeleteMovie: (id: string, e: React.MouseEvent) => void;
}

export const MovieGrid: React.FC<MovieGridProps> = ({ movies, onMovieSelect, onDeleteMovie }) => {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Play className="w-8 h-8 text-gray-600 ml-1" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Your library is empty</h3>
        <p className="max-w-md text-center">Upload movies to start building your local streaming collection. Add your own tags/genres to organize and filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
      {movies.map((movie) => (
        <div 
          key={movie.id}
          className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-red-900/10 border border-white/5 hover:border-white/20 cursor-pointer"
          onClick={() => onMovieSelect(movie)}
        >
          {/* Thumbnail Placeholder - Generative Color Gradient based on ID */}
          <div className="aspect-video relative overflow-hidden bg-gray-900">
             <div 
               className="absolute inset-0 opacity-40 mix-blend-overlay"
               style={{
                 backgroundImage: `linear-gradient(45deg, #${movie.id.slice(0,6)}, #${movie.id.slice(movie.id.length-6)})`
               }}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
             
             {/* Play Overlay */}
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                 <Play className="w-6 h-6 ml-1" />
               </div>
             </div>

             <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={(e) => onDeleteMovie(movie.id, e)}
                  className="p-2 bg-black/60 hover:bg-red-600 rounded-full text-white/80 hover:text-white transition-colors backdrop-blur-md"
                  title="Delete Movie"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg text-white leading-tight mb-1 group-hover:text-red-500 transition-colors line-clamp-1">{movie.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-2 min-h-[2.5em]">{movie.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {movie.genre.slice(0, 2).map((g) => (
                <span key={g} className="px-2 py-0.5 bg-white/10 rounded text-[10px] uppercase font-bold tracking-wider text-gray-300">
                  {g}
                </span>
              ))}
            </div>

            <div className="pt-3 mt-1 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{movie.year}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-600" />
                <span>{movie.rating}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
