import cors from 'cors';
import express from 'express';
import fs from 'fs';
import mime from 'mime-types';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(__dirname, 'media');
const PRINT_DIR = process.env.PRINT_DIR || path.join(__dirname, 'prints');
const MOVIE_DB_FILE = path.join(MEDIA_DIR, 'movies.json');
const PRINT_DB_FILE = path.join(PRINT_DIR, 'prints.json');

fs.mkdirSync(MEDIA_DIR, { recursive: true });
fs.mkdirSync(PRINT_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());

const loadDb = (file) => {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse DB file, resetting:', err);
    return [];
  }
};

const saveDb = (file, entries) => {
  fs.writeFileSync(file, JSON.stringify(entries, null, 2));
};

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, MEDIA_DIR),
  filename: (req, file, cb) => {
    const incomingId = (req.body?.id || '').trim();
    const id = incomingId || uuidv4();
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({ storage });
const printStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, PRINT_DIR),
  filename: (_req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname) || '';
    cb(null, `${id}${ext}`);
  },
});
const uploadPrint = multer({ storage: printStorage });

const parseGenres = (genreField) => {
  if (!genreField) return ['Unknown'];
  if (Array.isArray(genreField)) return genreField;
  if (typeof genreField === 'string') {
    try {
      const parsed = JSON.parse(genreField);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON, treat as comma separated
    }
    return genreField.split(',').map((g) => g.trim()).filter(Boolean).length
      ? genreField.split(',').map((g) => g.trim()).filter(Boolean)
      : ['Unknown'];
  }
  return ['Unknown'];
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/movies', (_req, res) => {
  const db = loadDb(MOVIE_DB_FILE);
  const sorted = db.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(sorted);
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing file field "file"' });
  }

  const db = loadDb(MOVIE_DB_FILE);
  const incomingId = (req.body?.id || '').trim();
  const id = incomingId || path.parse(req.file.filename).name;

  const metadata = {
    id,
    title: req.body?.title || req.file.originalname,
    originalFilename: req.file.originalname,
    description: req.body?.description || '',
    genre: parseGenres(req.body?.genre),
    year: req.body?.year || new Date().getFullYear().toString(),
    rating: req.body?.rating || 'NR',
    director: req.body?.director || 'Unknown',
    fileSize: req.file.size,
    duration: Number(req.body?.duration) || undefined,
    createdAt: Number(req.body?.createdAt) || Date.now(),
    storagePath: req.file.filename,
  };

  db.push(metadata);
  saveDb(MOVIE_DB_FILE, db);

  res.json(metadata);
});

app.get('/api/movies/:id/stream', (req, res) => {
  const db = loadDb(MOVIE_DB_FILE);
  const movie = db.find((m) => m.id === req.params.id);
  if (!movie) return res.sendStatus(404);

  const filePath = path.join(MEDIA_DIR, movie.storagePath || `${movie.id}.mp4`);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = mime.lookup(filePath) || 'application/octet-stream';

  if (!range) {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
  const chunkSize = end - start + 1;

  const stream = fs.createReadStream(filePath, { start, end });
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': contentType,
  });
  stream.pipe(res);
});

app.delete('/api/movies/:id', (req, res) => {
  const db = loadDb(MOVIE_DB_FILE);
  const movie = db.find((m) => m.id === req.params.id);
  if (!movie) return res.sendStatus(404);

  const filePath = path.join(MEDIA_DIR, movie.storagePath || `${movie.id}.mp4`);
  try {
    fs.rmSync(filePath, { force: true });
  } catch (err) {
    console.warn('Failed to remove file', err);
  }

  const filtered = db.filter((m) => m.id !== req.params.id);
  saveDb(MOVIE_DB_FILE, filtered);
  res.sendStatus(204);
});

app.use('/media', express.static(MEDIA_DIR));

// 3D Prints
app.get('/api/prints', (_req, res) => {
  const db = loadDb(PRINT_DB_FILE);
  const sorted = db.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
  res.json(sorted);
});

app.post('/api/prints/upload', uploadPrint.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing file field "file"' });
  }

  const db = loadDb(PRINT_DB_FILE);
  const id = path.parse(req.file.filename).name;

  const metadata = {
    id,
    originalFilename: req.file.originalname,
    storagePath: req.file.filename,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: Date.now(),
  };

  db.push(metadata);
  saveDb(PRINT_DB_FILE, db);

  res.json(metadata);
});

app.get('/api/prints/:id/download', (req, res) => {
  const db = loadDb(PRINT_DB_FILE);
  const file = db.find((p) => p.id === req.params.id);
  if (!file) return res.sendStatus(404);

  const filePath = path.join(PRINT_DIR, file.storagePath || `${file.id}`);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);

  res.download(filePath, file.originalFilename || path.basename(filePath));
});

app.delete('/api/prints/:id', (req, res) => {
  const db = loadDb(PRINT_DB_FILE);
  const file = db.find((p) => p.id === req.params.id);
  if (!file) return res.sendStatus(404);

  const filePath = path.join(PRINT_DIR, file.storagePath || `${file.id}`);
  try {
    fs.rmSync(filePath, { force: true });
  } catch (err) {
    console.warn('Failed to remove print file', err);
  }

  const filtered = db.filter((p) => p.id !== req.params.id);
  saveDb(PRINT_DB_FILE, filtered);
  res.sendStatus(204);
});

app.use('/prints', express.static(PRINT_DIR));

app.listen(PORT, HOST, () => {
  console.log(`Media server running at http://${HOST}:${PORT}`);
  console.log(`Media directory: ${MEDIA_DIR}`);
  console.log(`Prints directory: ${PRINT_DIR}`);
});
