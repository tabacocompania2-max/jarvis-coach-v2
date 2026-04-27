import { db } from '../config/database';

const words = [
  // BEGINNER (Level 1-2)
  { english: "hello", spanish: "hola", pronunciation: "heh-loh", phonetic: "/həˈloʊ/", part_of_speech: "exclamation", difficulty_level: 1, category: "greetings", example_sentences: [{ english: "Hello, how are you?", spanish: "¿Hola, cómo estás?" }] },
  { english: "water", spanish: "agua", pronunciation: "wah-ter", phonetic: "/ˈwɔːtər/", part_of_speech: "noun", difficulty_level: 1, category: "food", example_sentences: [{ english: "I need some water.", spanish: "Necesito un poco de agua." }] },
  { english: "book", spanish: "libro", pronunciation: "buk", phonetic: "/bʊk/", part_of_speech: "noun", difficulty_level: 1, category: "objects", example_sentences: [{ english: "I am reading a book.", spanish: "Estoy leyendo un libro." }] },
  { english: "friend", spanish: "amigo", pronunciation: "frend", phonetic: "/frend/", part_of_speech: "noun", difficulty_level: 2, category: "people", example_sentences: [{ english: "She is my best friend.", spanish: "Ella es mi mejor amiga." }] },
  { english: "school", spanish: "escuela", pronunciation: "skool", phonetic: "/skuːl/", part_of_speech: "noun", difficulty_level: 2, category: "places", example_sentences: [{ english: "I go to school every day.", spanish: "Voy a la escuela todos los días." }] },
  
  // INTERMEDIATE (Level 4-6)
  { english: "challenge", spanish: "desafío", pronunciation: "chal-enj", phonetic: "/ˈtʃælɪndʒ/", part_of_speech: "noun", difficulty_level: 5, category: "abstract", example_sentences: [{ english: "Learning English is a challenge.", spanish: "Aprender inglés es un desafío." }] },
  { english: "environment", spanish: "medio ambiente", pronunciation: "en-vahy-ruh-ment", phonetic: "/ɪnˈvaɪrənmənt/", part_of_speech: "noun", difficulty_level: 6, category: "nature", example_sentences: [{ english: "We must protect the environment.", spanish: "Debemos proteger el medio ambiente." }] },
  { english: "development", spanish: "desarrollo", pronunciation: "dih-vel-uhp-muhnt", phonetic: "/dɪˈveləpmənt/", part_of_speech: "noun", difficulty_level: 5, category: "business", example_sentences: [{ english: "Software development is fun.", spanish: "El desarrollo de software es divertido." }] },
  { english: "knowledge", spanish: "conocimiento", pronunciation: "nol-ij", phonetic: "/ˈnɑːlɪdʒ/", part_of_speech: "noun", difficulty_level: 6, category: "education", example_sentences: [{ english: "Knowledge is power.", spanish: "El conocimiento es poder." }] },
  { english: "opportunity", spanish: "oportunidad", pronunciation: "op-er-too-ni-tee", phonetic: "/ˌɑːpərˈtuːnəti/", part_of_speech: "noun", difficulty_level: 5, category: "life", example_sentences: [{ english: "This is a great opportunity.", spanish: "Esta es una gran oportunidad." }] },

  // ADVANCED (Level 8-10)
  { english: "unprecedented", spanish: "sin precedentes", pronunciation: "uhn-pres-i-den-tid", phonetic: "/ʌnˈpresɪdentɪd/", part_of_speech: "adjective", difficulty_level: 9, category: "advanced", example_sentences: [{ english: "This situation is unprecedented.", spanish: "Esta situación no tiene precedentes." }] },
  { english: "comprehensive", spanish: "exhaustivo", pronunciation: "kom-pri-hen-siv", phonetic: "/ˌkɑːmprɪˈhensɪv/", part_of_speech: "adjective", difficulty_level: 8, category: "academic", example_sentences: [{ english: "We need a comprehensive report.", spanish: "Necesitamos un informe exhaustivo." }] },
  { english: "ambiguous", spanish: "ambiguo", pronunciation: "am-big-yoo-uhs", phonetic: "/æmˈbɪɡjuəs/", part_of_speech: "adjective", difficulty_level: 8, category: "abstract", example_sentences: [{ english: "The instructions were ambiguous.", spanish: "Las instrucciones eran ambiguas." }] },
  { english: "mitigate", spanish: "mitigar", pronunciation: "mit-i-geyt", phonetic: "/ˈmɪtɪɡeɪt/", part_of_speech: "verb", difficulty_level: 9, category: "formal", example_sentences: [{ english: "We need to mitigate the risks.", spanish: "Necesitamos mitigar los riesgos." }] },
  { english: "resilient", spanish: "resiliente", pronunciation: "ri-zil-yuhnt", phonetic: "/rɪˈzɪliənt/", part_of_speech: "adjective", difficulty_level: 8, category: "psychology", example_sentences: [{ english: "Children are very resilient.", spanish: "Los niños son muy resilientes." }] }
  
  // (Aquí se pueden agregar más palabras hasta completar las 2000+)
];

export async function seedWords() {
  console.log('--- Starting Word Seeder ---');
  let count = 0;
  
  try {
    for (const word of words) {
      await db.query(
        `INSERT INTO words (english, spanish, pronunciation, phonetic, part_of_speech, difficulty_level, category, example_sentences)
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
      count++;
    }
    console.log(`--- Seeding completed: ${count} words processed ---`);
  } catch (error) {
    console.error('Error seeding words:', error);
  }
}

// Para ejecutar directamente
if (require.main === module) {
  seedWords().then(() => process.exit(0));
}
