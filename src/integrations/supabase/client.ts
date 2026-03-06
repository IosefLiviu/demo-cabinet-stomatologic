// Mock Supabase client - replaces the real Supabase client with in-memory database
// All existing hooks and components continue to work without changes

import { mockSupabase } from './mockClient';
import { generateSeedData } from './seedData';

// Initialize with seed data if not already seeded
if (!mockSupabase._isSeeded()) {
  console.log('[Demo] Initializing database with seed data...');
  const seedData = generateSeedData();
  mockSupabase._initStore(seedData);
  console.log('[Demo] Database initialized! Login: admin@perfectsmile.ro / demo123');
}

// Export as 'supabase' so all existing imports work unchanged
export const supabase = mockSupabase as any;
