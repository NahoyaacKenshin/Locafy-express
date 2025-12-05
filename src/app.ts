import express from "express";
import cors from "cors";
import routes from "@/routes";
import passport from "passport";
import { initializePassport } from "@/services/auth/passport";
import cookieParser from "cookie-parser";
import businessRoutes from './routes/businessRoutes';
import discussionRoutes from '@/routes/discussionRoutes';
import favoriteRoutes from '@/routes/favoriteRoutes';
import adminRoutes from '@/routes/adminRoutes';

export const app = express();

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [
    'http://localhost:3000', // Local frontend for testing
  ];
  
  // Add FRONTEND_URL from environment if set
  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
    origins.push(frontendUrl);
    origins.push(`${frontendUrl}/`); // Some browsers send trailing slash
  }
  
  return origins;
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true, // This allows cookies/sessions to work
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use('/api/businesses', businessRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);

initializePassport();
app.use(passport.initialize());

app.use("/api", routes);