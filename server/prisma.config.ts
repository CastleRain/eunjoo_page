import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Generation/validation do not connect. Runtime requires an explicit DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL || 'postgresql://localhost:5432/ondam_development' },
});
