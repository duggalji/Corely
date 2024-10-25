export default {
  dialect: "postgresql",
  schema: "./utils/db/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: "postgresql://neondb_owner:yB3wurHzc9gQ@ep-fancy-cell-a5ksb9ca-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
    connectionString:
      "postgresql://neondb_owner:yB3wurHzc9gQ@ep-fancy-cell-a5ksb9ca.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
};

//db string