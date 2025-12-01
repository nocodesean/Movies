export interface MovieMetadata {
  id: string;
  title: string;
  originalFilename: string;
  description: string;
  genre: string[];
  year: string;
  rating: string;
  director: string;
  fileSize: number;
  duration?: number;
  createdAt: number;
}

export interface Movie extends MovieMetadata {
  fileHandle?: File; // For initial upload context
}

export interface PrintMetadata {
  id: string;
  originalFilename: string;
  storagePath?: string;
  fileSize: number;
  mimeType?: string;
  uploadedAt: number;
}

export enum AppView {
  GRID = 'GRID',
  PLAYER = 'PLAYER',
  UPLOAD = 'UPLOAD',
  SETTINGS = 'SETTINGS'
}
