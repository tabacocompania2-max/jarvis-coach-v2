import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// PALABRAS DE EJEMPLO (agregar 2000+ en producción)
const WORDS_DATA = [
  {
    english: 'hello',
    spanish: 'hola',
    pronunciation: 'huh-LOH',
    phonetic: '/həˈloʊ/',
    part_of_speech: 'interjection',
    difficulty_level: 1,
    category: 'greetings',
    example_sentences: [
      {
        english: 'Hello, nice to meet you',
        spanish: 'Hola, es un placer conocerte'
      },
      {
        english: 'Hello there!',
        spanish: '¡Hola de allá!'
      }
    ]
  },
  {
    english: 'goodbye',
    spanish: 'adiós',
    pronunciation: 'good-BY',
    phonetic: '/ɡʊdˈbaɪ/',
    part_of_speech: 'interjection',
    difficulty_level: 1,
    category: 'greetings',
    example_sentences: [
      {
        english: 'Goodbye, see you later',
        spanish: 'Adiós, te veo luego'
      }
    ]
  },
  {
    english: 'thank you',
    spanish: 'gracias',
    pronunciation: 'THANK you',
    phonetic: '/ˈθæŋk juː/',
    part_of_speech: 'interjection',
    difficulty_level: 1,
    category: 'politeness',
    example_sentences: [
      {
        english: 'Thank you for your help',
        spanish: 'Gracias por tu ayuda'
      }
    ]
  },
  {
    english: 'yes',
    spanish: 'sí',
    pronunciation: 'YES',
    phonetic: '/jɛs/',
    part_of_speech: 'interjection',
    difficulty_level: 1,
    category: 'responses',
    example_sentences: [
      {
        english: 'Yes, I agree',
        spanish: 'Sí, estoy de acuerdo'
      }
    ]
  },
  {
    english: 'no',
    spanish: 'no',
    pronunciation: 'NOH',
    phonetic: '/noʊ/',
    part_of_speech: 'interjection',
    difficulty_level: 1,
    category: 'responses',
    example_sentences: [
      {
        english: 'No, thank you',
        spanish: 'No, gracias'
      }
    ]
  },
  {
    english: 'please',
    spanish: 'por favor',
    pronunciation: 'PLEASE',
    phonetic: '/pliːz/',
    part_of_speech: 'interjection',
    difficulty_level: 1,
    category: 'politeness',
    example_sentences: [
      {
        english: 'Please pass the salt',
        spanish: 'Por favor pasa la sal'
      }
    ]
  },
  {
    english: 'water',
    spanish: 'agua',
    pronunciation: 'WO-ter',
    phonetic: '/ˈwɔtər/',
    part_of_speech: 'noun',
    difficulty_level: 1,
    category: 'food',
    example_sentences: [
      {
        english: 'I need some water',
        spanish: 'Necesito agua'
      }
    ]
  },
  {
    english: 'food',
    spanish: 'comida',
    pronunciation: 'FOOD',
    phonetic: '/fuːd/',
    part_of_speech: 'noun',
    difficulty_level: 1,
    category: 'food',
    example_sentences: [
      {
        english: 'This food is delicious',
        spanish: 'Esta comida es deliciosa'
      }
    ]
  },
  {
    english: 'friend',
    spanish: 'amigo',
    pronunciation: 'FREND',
    phonetic: '/frɛnd/',
    part_of_speech: 'noun',
    difficulty_level: 1,
    category: 'relationships',
    example_sentences: [
      {
        english: 'He is my best friend',
        spanish: 'Es mi mejor amigo'
      }
    ]
  },
  {
    english: 'happy',
    spanish: 'feliz',
    pronunciation: 'HAP-ee',
    phonetic: '/ˈhæpi/',
    part_of_speech: 'adjective',
    difficulty_level: 1,
    category: 'emotions',
    example_sentences: [
      {
        english: 'I am very happy',
        spanish: 'Soy muy feliz'
      }
    ]
  }
];

async function seedWords() {
  try {
    console.log('🌱 Starting word seeding...\n');
    
    let inserted = 0;
    let skipped = 0;
    
    for (const word of WORDS_DATA) {
      try {
        await pool.query(
          `INSERT INTO words 
           (english, spanish, pronunciation, phonetic, part_of_speech, 
            difficulty_level, category, example_sentences)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (english) DO NOTHING`,
          [
            word.english,
            word.spanish,
            word.pronunciation,
            word.phonetic,
            word.part_of_speech,
            word.difficulty_level,
            word.category,
            JSON.stringify(word.example_sentences)
          ]
        );
        inserted++;
      } catch (error) {
        console.error(`Error inserting ${word.english}:`, error);
        skipped++;
      }
      
      // Progress indicator
      if ((inserted + skipped) % 100 === 0 && (inserted + skipped) !== 0) {
        console.log(`⏳ Progress: ${inserted + skipped}/${WORDS_DATA.length}`);
      }
    }
    
    console.log(`\n✅ Seeding completed!`);
    console.log(`   ✓ Words inserted: ${inserted}`);
    console.log(`   ✓ Words skipped (duplicates/errors): ${skipped}`);
    console.log(`   ✓ Total: ${WORDS_DATA.length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedWords();
