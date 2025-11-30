import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MovieGrid } from './components/MovieGrid';
import { UploadModal } from './components/UploadModal';
import { Player } from './components/Player';
import { MovieMetadata } from './types';
import { getMovies, deleteMovie } from './services/storage';

const App: React.FC = () => {
  const [movies, setMovies] = useState<MovieMetadata[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMovie, setActiveMovie] = useState<MovieMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<string>('All');

  const refreshMovies = async () => {
    setLoading(true);
    try {
      const data = await getMovies();
      setMovies(data);
    } catch (e) {
      console.error("Failed to fetch movies", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMovies();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this movie from your local library?")) {
      await deleteMovie(id);
      await refreshMovies();
    }
  };

  const availableGenres = Array.from(
    new Set(
      movies
        .flatMap((m) => m.genre || [])
        .map((g) => g.trim())
        .filter(Boolean)
    )
  ).sort();

  const filteredMovies = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genre.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre =
      activeGenre === 'All' || m.genre.map((g) => g.toLowerCase()).includes(activeGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-red-500/30">
      <Navbar 
        onUploadClick={() => setIsUploadOpen(true)}
        onHomeClick={() => setActiveMovie(null)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
           <div>
              <h1 className="text-3xl font-bold mb-2">Library</h1>
              <p className="text-gray-400 text-sm">
                {movies.length} {movies.length === 1 ? 'title' : 'titles'} stored locally
              </p>
           </div>
        </div>
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-400">Filter:</span>
          <button
            onClick={() => setActiveGenre('All')}
            className={`px-3 py-1 rounded-full text-sm border ${activeGenre === 'All' ? 'border-red-600 text-white bg-red-600/20' : 'border-white/10 text-gray-300 hover:border-white/30'}`}
          >
            All
          </button>
          {availableGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-3 py-1 rounded-full text-sm border capitalize ${activeGenre === genre ? 'border-red-600 text-white bg-red-600/20' : 'border-white/10 text-gray-300 hover:border-white/30'}`}
            >
              {genre}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <MovieGrid 
            movies={filteredMovies} 
            onMovieSelect={setActiveMovie}
            onDeleteMovie={handleDelete}
          />
        )}
      </main>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={() => {
          setIsUploadOpen(false);
          refreshMovies();
        }}
      />

      {activeMovie && (
        <Player 
          movie={activeMovie} 
          onClose={() => setActiveMovie(null)} 
        />
      )}
    </div>
  );
};

export default App;
