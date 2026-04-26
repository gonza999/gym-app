require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Validate required env vars on startup
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`ERROR: Variable de entorno ${key} no definida`);
    process.exit(1);
  }
}

const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');

const app = express();

// Trust proxy — Render runs behind a reverse proxy
app.set('trust proxy', 1);

// Middleware global
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',');
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3001');
}

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('CORS no permitido'));
    },
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rutas
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });
