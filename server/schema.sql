-- English Learning Coach (ELC) Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    level VARCHAR(50) DEFAULT 'beginner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    daily_streak INTEGER DEFAULT 0,
    total_words_learned INTEGER DEFAULT 0
);

-- Table: words
CREATE TABLE IF NOT EXISTS words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    english VARCHAR(255) UNIQUE NOT NULL,
    spanish VARCHAR(255) NOT NULL,
    pronunciation VARCHAR(255),
    phonetic VARCHAR(255),
    part_of_speech VARCHAR(50),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    category VARCHAR(100),
    example_sentences JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: daily_lessons
CREATE TABLE daily_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    words JSONB DEFAULT '[]', -- JSON array of 20 word IDs or word objects
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_word_progress
CREATE TABLE user_word_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    word_id UUID REFERENCES words(id) ON DELETE CASCADE,
    times_practiced INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_practiced TIMESTAMP WITH TIME ZONE,
    mastered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, word_id)
);

-- Table: user_sentences
CREATE TABLE user_sentences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sentence TEXT NOT NULL,
    words_used JSONB DEFAULT '[]',
    evaluation JSONB DEFAULT '{}', -- {grammar: score, vocab: score, context: score}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: voice_recordings
CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    word_id UUID REFERENCES words(id),
    audio_url VARCHAR(512) NOT NULL,
    transcript TEXT,
    pronunciation_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) CHECK (type IN ('podcast', 'song')),
    title VARCHAR(255) NOT NULL,
    artist_or_author VARCHAR(255),
    spotify_id VARCHAR(100),
    youtube_id VARCHAR(100),
    context_tags JSONB DEFAULT '[]', -- ['gym', 'relax', 'focus']
    vocabulary_level INTEGER CHECK (vocabulary_level BETWEEN 1 AND 10),
    keywords JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
