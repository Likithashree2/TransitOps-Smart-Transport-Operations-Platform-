// Reuses the SAME Prisma schema/DB as the core TransitOps backend.
// This module assumes `prisma generate` has already been run against the
// existing schema.prisma that defines vehicles, drivers, trips,
// maintenance_logs, fuel_logs, expenses, ai_insights.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
