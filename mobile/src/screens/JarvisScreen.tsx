import React, { useState as useReactState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSpeechAudio } from '../hooks/useSpeechAudio';
import { MediaPlayer } from '../components/MediaPlayer';

export function JarvisScreen({ navigation }: any) {
  const {
    isListening,
    isProcessing,
    isJarvisSpeaking,
    transcript,
    jarvisResponse,
    audioLevel,
    currentMedia,
    startListening,
    stopListening,
    stopTTS,
    handleUserMessage,
  } = useSpeechAudio();

  const [inputText, setInputText] = useReactState('');

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    await handleUserMessage(textToSend);
  };

  const handleMicPress = async () => {
    if (isJarvisSpeaking) {
      stopTTS();
    } else if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎓 Jarvis</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Progress')}
            style={styles.historyButton}
          >
            <Text style={styles.historyIcon}>📊 Historial</Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>Tu profesor de inglés 24/7</Text>
        </View>

        {/* Visualizador de estado */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>
            {isProcessing
              ? '⏳ Procesando...'
              : isJarvisSpeaking
              ? '🔊 Jarvis hablando'
              : isListening
              ? '🎤 Escuchando'
              : '⭕ Apagado'}
          </Text>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isListening ? '#ef4444' : isJarvisSpeaking ? '#f59e0b' : '#06b6d4',
                opacity: isListening || isProcessing || isJarvisSpeaking ? 1 : 0.5,
              },
            ]}
          />
        </View>

        {/* Nivel de audio */}
        {isListening && (
          <View style={styles.audioLevelContainer}>
            <View
              style={[
                styles.audioLevel,
                { width: `${audioLevel}%` },
              ]}
            />
          </View>
        )}

        {/* Respuesta de Jarvis */}
        {jarvisResponse && (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseLabel}>Jarvis dice:</Text>
              {isJarvisSpeaking && <Text style={styles.speakingBadge}>LIVE</Text>}
            </View>
            <Text style={styles.responseText}>"{jarvisResponse}"</Text>
          </View>
        )}

        {/* Reproductor de Media */}
        {currentMedia && (
          <MediaPlayer
            mediaType={currentMedia.type}
            title={currentMedia.title}
            artist={currentMedia.artist}
            onPress={() => {
              console.log('▶️ Reproduciendo:', currentMedia.title);
            }}
          />
        )}

        {/* Transcript del usuario */}
        {transcript && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>Tú dijiste:</Text>
            <Text style={styles.transcriptText}>"{transcript}"</Text>
          </View>
        )}

        {/* Placeholder para historial */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyLabel}>Conversación:</Text>
          <View style={styles.historyBox}>
            <Text style={styles.historyText}>
              {isListening ? 'Jarvis está en espera. Di "Jarvis" para activar...' : 'Pulsa el micro para comenzar...'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Barra de entrada de texto */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Escribe un comando a Jarvis..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleTextSubmit}
        />
        {inputText.length > 0 && (
          <TouchableOpacity style={styles.sendButton} onPress={handleTextSubmit}>
            <Text style={styles.sendIcon}>🚀</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Botón de micrófono (flotante) */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening && styles.micButtonActive,
            isJarvisSpeaking && styles.micButtonSpeaking,
            isProcessing && styles.micButtonDisabled,
          ]}
          onPress={handleMicPress}
          disabled={isProcessing}
        >
          <Text style={styles.micIcon}>
            {isListening || isJarvisSpeaking ? '⏹️' : '🎤'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.buttonLabel}>
          {isListening ? 'Detener' : isJarvisSpeaking ? 'Callar Jarvis' : 'Hablar'}
        </Text>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 160,
  },
  header: {
    paddingTop: 20,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  historyIcon: {
    color: '#06b6d4',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#06b6d4',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
    backgroundColor: '#1a1a2e',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  statusLabel: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  audioLevelContainer: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginBottom: 30,
    overflow: 'hidden',
  },
  audioLevel: {
    height: '100%',
    backgroundColor: '#06b6d4',
  },
  responseContainer: {
    backgroundColor: '#1e1e3a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseLabel: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  speakingBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  responseText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 26,
  },
  transcriptContainer: {
    backgroundColor: '#161625',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  transcriptLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  transcriptText: {
    color: '#b0b0b0',
    fontSize: 15,
    fontStyle: 'italic',
  },
  historyContainer: {
    marginTop: 10,
  },
  historyLabel: {
    color: '#555',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  historyBox: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
  },
  historyText: {
    color: '#666',
    fontSize: 14,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 10,
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  micButtonSpeaking: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  micButtonDisabled: {
    backgroundColor: '#333',
    shadowOpacity: 0,
  },
  micIcon: {
    fontSize: 32,
  },
  buttonLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161625',
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  textInput: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
  },
});
