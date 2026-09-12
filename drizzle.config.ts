import { defineConfig } from "drizzle-kit";

const getDbUrl = () => {
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL;
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  throw new Error(
    "Database URL not found. Set POSTGRES_URL or DATABASE_URL for Drizzle Kit."
  );
};

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDbUrl(),
  },
});
