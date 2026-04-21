import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { initSocket } from './socket';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// Initialize WebSocket
initSocket(server);

// Supabase Init Check
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mount Routes
app.use('/api/auth', authRoutes);

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', time: new Date() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend attached via Express & Socket.io running on port ${PORT}`);
});
