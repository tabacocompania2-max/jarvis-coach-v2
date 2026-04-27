-- TABLA: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  firebase_uid VARCHAR(255) UNIQUE,
  level VARCHAR(50) DEFAULT 'beginner',
  daily_streak INTEGER DEFAULT 0,
  total_words_learned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- TABLA: words
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  english VARCHAR(255) NOT NULL UNIQUE,
  spanish VARCHAR(255) NOT NULL,
  pronunciation VARCHAR(255),
  phonetic VARCHAR(255),
  part_of_speech VARCHAR(50),
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
  category VARCHAR(100),
  example_sentences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
CREATE INDEX IF NOT EXISTS idx_words_english ON words(english);

-- TABLA: daily_lessons
CREATE TABLE IF NOT EXISTS daily_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  words JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_lessons_user_id ON daily_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_date ON daily_lessons(date);

-- TABLA: user_word_progress
CREATE TABLE IF NOT EXISTS user_word_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_practiced TIMESTAMP,
  mastered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_user_word_progress_user_id ON user_word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_word_id ON user_word_progress(word_id);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_mastered ON user_word_progress(mastered);

-- TABLA: user_sentences
CREATE TABLE IF NOT EXISTS user_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  words_used JSONB,
  evaluation JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sentences_user_id ON user_sentences(user_id);

-- TABLA: voice_recordings
CREATE TABLE IF NOT EXISTS voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  audio_url VARCHAR(500),
  transcript TEXT,
  pronunciation_score FLOAT CHECK (pronunciation_score >= 0 AND pronunciation_score <= 100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_id ON voice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_word_id ON voice_recordings(word_id);

-- TABLA: recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  artist_or_author VARCHAR(255),
  spotify_id VARCHAR(255),
  youtube_id VARCHAR(255),
  context_tags JSONB,
  vocabulary_level INTEGER CHECK (vocabulary_level >= 1 AND vocabulary_level <= 10),
  keywords JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);
CREATE INDEX IF NOT EXISTS idx_recommendations_context ON recommendations USING GIN (context_tags);

-- TABLA: conversation_logs
CREATE TABLE IF NOT EXISTS conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  jarvis_response TEXT NOT NULL,
  word_context UUID REFERENCES words(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_id ON conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_created_at ON conversation_logs(created_at);

-- TABLA: user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  speech_speed FLOAT DEFAULT 0.9,
  language_explanations VARCHAR(10) DEFAULT 'es',
  preferred_content_type VARCHAR(50),
  notification_enabled BOOLEAN DEFAULT TRUE,
  notification_time TIME DEFAULT '08:00:00',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- TABLA: analytics
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  words_learned INTEGER DEFAULT 0,
  words_reviewed INTEGER DEFAULT 0,
  sentences_formed INTEGER DEFAULT 0,
  average_pronunciation_score FLOAT,
  session_duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
