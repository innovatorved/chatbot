import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Define a type that allows indexing with string keys
type Env = {
  [key: string]: any;
};

// Create a singleton instance
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (dbInstance) return dbInstance;

  // Try to get context from Cloudflare Worker request
  let connectionString: string | undefined;

  try {
     const context = getCloudflareContext();
     // In Cloudflare Workers, environment variables are often in context.env
     // But @opennextjs/cloudflare should expose them via process.env too in standard nodejs_compat

     // Check for process.env first (standard)
     connectionString = process.env.POSTGRES_URL;

     // Fallback to checking context.env if needed and available
     if (!connectionString && context?.env) {
       connectionString = (context.env as Env).POSTGRES_URL;
     }
  } catch (e) {
    // If running outside of request context (e.g. build time or standard node), fallback to process.env
    connectionString = process.env.POSTGRES_URL;
  }

  if (!connectionString) {
    throw new Error("POSTGRES_URL is not defined in environment");
  }

  // Use postgres.js
  const client = postgres(connectionString);
  dbInstance = drizzle(client);
  return dbInstance;
};
