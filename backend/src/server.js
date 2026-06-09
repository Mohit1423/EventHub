import './config/loadEnv.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { initSocket } from './services/socketService.js';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();
console.log('DEBUG: STORAGE_PROVIDER is:', process.env.STORAGE_PROVIDER);
console.log('DEBUG: AZURE_STORAGE_CONNECTION_STRING is defined:', !!process.env.AZURE_STORAGE_CONNECTION_STRING);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
initSocket(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/interactions', interactionRoutes);

app.get('/', (req, res) => {
  res.send('Event & Media Management Platform API is running...');
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ 
    message: err.message || 'An unexpected server error occurred', 
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
