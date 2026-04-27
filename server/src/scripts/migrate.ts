import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  try {
    console.log('🔄 Starting migrations...\n');
    
    // Leer archivo SQL - Ajustado para que coincida con src/migrations
    const sqlPath = path.join(__dirname, '../migrations/001_init_schema.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Schema file not found at:', sqlPath);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📝 Running SQL schema...');
    await pool.query(sql);
    
    console.log('✅ Migrations completed successfully!\n');
    console.log('📊 Tables created:');
    console.log('   ✓ users');
    console.log('   ✓ words');
    console.log('   ✓ daily_lessons');
    console.log('   ✓ user_word_progress');
    console.log('   ✓ user_sentences');
    console.log('   ✓ voice_recordings');
    console.log('   ✓ recommendations');
    console.log('   ✓ conversation_logs');
    console.log('   ✓ user_preferences');
    console.log('   ✓ analytics\n');
    
    console.log('🚀 Next step: npm run seed:words');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
