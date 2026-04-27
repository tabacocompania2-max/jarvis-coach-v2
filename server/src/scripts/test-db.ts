import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Conexión básica
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    console.log('   Current time:', result.rows[0].now);
    
    // Test 2: Contar tablas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`✅ Found ${tablesResult.rows.length} tables`);
    
    // Test 3: Contar palabras (si existen)
    try {
      const wordsResult = await pool.query('SELECT COUNT(*) as count FROM words');
      console.log(`✅ Total words in database: ${wordsResult.rows[0].count}`);
    } catch (e) {
      console.log('⚠️  Words table not created yet');
    }
    
    // Test 4: Contar usuarios (si existen)
    try {
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Total users in database: ${usersResult.rows[0].count}`);
    } catch (e) {
      console.log('⚠️  Users table not created yet');
    }
    
    console.log('\n✅ All database tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDatabase();
