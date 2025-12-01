import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MovieGrid } from './components/MovieGrid';
import { UploadModal } from './components/UploadModal';
import { Player } from './components/Player';
import { PrintsPanel } from './components/PrintsPanel';
import { MovieMetadata, PrintMetadata } from './types';
import { getMovies, deleteMovie, getPrints, uploadPrint, deletePrint } from './services/storage';
import { Upload } from 'lucide-react';

const App: React.FC = () => {
  const [movies, setMovies] = useState<MovieMetadata[]>([]);
  const [prints, setPrints] = useState<PrintMetadata[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMovie, setActiveMovie] = useState<MovieMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'movies' | 'prints'>('movies');
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
    const loadPrints = async () => {
      setPrintLoading(true);
      try {
        const data = await getPrints();
        setPrints(data);
      } catch (e) {
        console.error("Failed to fetch prints", e);
      } finally {
        setPrintLoading(false);
      }
    };
    loadPrints();
  }, []);

  const handlePrintUpload = async (file: File) => {
    setPrintLoading(true);
    try {
      await uploadPrint(file);
      const updated = await getPrints();
      setPrints(updated);
    } catch (e) {
      console.error('Failed to upload print', e);
      alert('Failed to upload print file.');
    } finally {
      setPrintLoading(false);
    }
  };

  const handlePrintDelete = async (id: string) => {
    if (!confirm('Delete this print file from the server?')) return;
    setPrintLoading(true);
    try {
      await deletePrint(id);
      const updated = await getPrints();
      setPrints(updated);
    } catch (e) {
      console.error('Failed to delete print', e);
      alert('Failed to delete print file.');
    } finally {
      setPrintLoading(false);
    }
  };

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
        onHomeClick={() => setActiveMovie(null)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveSection('movies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeSection === 'movies' ? 'border-red-600 bg-red-600/20 text-white' : 'border-white/10 text-gray-300 hover:border-white/30'}`}
          >
            Movies
          </button>
          <button
            onClick={() => setActiveSection('prints')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeSection === 'prints' ? 'border-red-600 bg-red-600/20 text-white' : 'border-white/10 text-gray-300 hover:border-white/30'}`}
          >
            3D Printing
          </button>
        </div>

        {activeSection === 'movies' ? (
          <>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Library</h1>
                <p className="text-gray-400 text-sm">
                  {movies.length} {movies.length === 1 ? 'title' : 'titles'} stored locally
                </p>
              </div>
              <div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-medium hover:bg-red-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload Movie
                </button>
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
          </>
        ) : (
          <PrintsPanel 
            prints={prints}
            onUpload={handlePrintUpload}
            onDelete={handlePrintDelete}
            loading={printLoading}
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
