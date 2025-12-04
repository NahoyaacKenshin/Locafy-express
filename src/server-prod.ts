// Production entry point with path resolution
import { register } from 'tsconfig-paths';
import { resolve } from 'path';

// Register path aliases - in compiled code, @/* maps to dist/*
// __dirname is dist/ when running from dist/server-prod.js
const baseUrl = resolve(__dirname);
register({
  baseUrl: baseUrl,
  paths: {
    '@/*': ['*']  // Map @/app to ./app.js in dist folder
  }
});

// Now import and run the server
import dotenv from "dotenv";
import { app } from "@/app";

dotenv.config();

const port = process.env.PORT || 7000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

