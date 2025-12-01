import { MovieMetadata, PrintMetadata } from '../types';

const API_BASE = (() => {
  const envBase = (import.meta as any).env?.VITE_API_URL;
  const hostname = window.location.hostname || 'localhost';
  const fallbackBase = `http://${hostname}:3001`;

  const pickBase = envBase && envBase.trim().length > 0 ? envBase : fallbackBase;

  try {
    const url = new URL(pickBase);
    if (['localhost', '127.0.0.1'].includes(url.hostname)) {
      // Make localhost work across devices by using the current host.
      url.hostname = hostname;
    }
    return `${url.toString().replace(/\/$/, '')}/api`;
  } catch {
    return `${fallbackBase.replace(/\/$/, '')}/api`;
  }
})();

const parseError = async (res: Response) => {
  const text = await res.text();
  return text || res.statusText;
};

export const saveMovie = async (metadata: MovieMetadata, file: File): Promise<MovieMetadata> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('id', metadata.id);
  formData.append('title', metadata.title);
  formData.append('description', metadata.description);
  formData.append('genre', JSON.stringify(metadata.genre || []));
  formData.append('year', metadata.year);
  formData.append('rating', metadata.rating);
  formData.append('director', metadata.director);
  formData.append('fileSize', metadata.fileSize.toString());
  formData.append('createdAt', metadata.createdAt.toString());

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${await parseError(res)}`);
  }
  return res.json();
};

export const getMovies = async (): Promise<MovieMetadata[]> => {
  const res = await fetch(`${API_BASE}/movies`);
  if (!res.ok) {
    throw new Error(`Failed to fetch movies: ${await parseError(res)}`);
  }
  return res.json();
};

export const getMovieFile = async (id: string): Promise<string> => {
  // Return a stream URL the player can consume directly
  return `${API_BASE}/movies/${id}/stream`;
};

export const deleteMovie = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/movies/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to delete movie: ${await parseError(res)}`);
  }
};

// 3D Prints
export const getPrints = async (): Promise<PrintMetadata[]> => {
  const res = await fetch(`${API_BASE}/prints`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prints: ${await parseError(res)}`);
  }
  return res.json();
};

export const uploadPrint = async (file: File): Promise<PrintMetadata> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/prints/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Print upload failed: ${await parseError(res)}`);
  }
  return res.json();
};

export const deletePrint = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/prints/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to delete print: ${await parseError(res)}`);
  }
};

export const getPrintDownloadUrl = (id: string): string => {
  return `${API_BASE}/prints/${id}/download`;
};
