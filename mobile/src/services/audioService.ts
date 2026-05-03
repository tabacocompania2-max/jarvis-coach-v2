import { Audio } from 'expo-av';

interface AudioBuffer {
  data: Float32Array;
  maxSize: number;
  currentIndex: number;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private audioBuffer: AudioBuffer;
  private isListening: boolean = false;
  private onAudioData: ((data: number[]) => void) | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private hasPermissions: boolean = false;

  constructor() {
    const bufferSize = 44100 * 5; // 5 segundos
    this.audioBuffer = {
      data: new Float32Array(bufferSize),
      maxSize: bufferSize,
      currentIndex: 0,
    };
  }

  async initialize(): Promise<void> {
    try {
      // 1. Solicitar permisos de micrófono
      const { status } = await Audio.requestPermissionsAsync();
      this.hasPermissions = status === 'granted';

      if (!this.hasPermissions) {
        console.warn('⚠️ Permiso de micrófono denegado');
        return;
      }

      // 2. Configurar modo de audio con valores compatibles SDK 54
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpiece: false,
        staysActiveInBackground: true,
      });

      console.log('✅ Audio inicializado y permisos concedidos');
    } catch (error) {
      console.error('❌ Error inicializando audio:', error);
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    try {
      // Validar permisos antes de continuar
      if (!this.hasPermissions) {
        const { status } = await Audio.requestPermissionsAsync();
        this.hasPermissions = status === 'granted';
        if (!this.hasPermissions) {
          throw new Error('No se tienen permisos de grabación de audio.');
        }
      }

      // Limpiar grabación anterior si existe
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e) {
          // Ignorar error si ya estaba detenido
        }
        this.recording = null;
      }

      this.recording = new Audio.Recording();
      
      // Configuración de grabación compatible con SDK 54
      await this.recording.prepareToRecordAsync({
        isMeteringEnabled: true, // ¡CRUCIAL para VAD!
        android: {
          extension: '.wav',
          outputFormat: 0, // DEFAULT
          audioEncoder: 0, // DEFAULT
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: 127, // MAX
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await this.recording.startAsync();
      this.isListening = true;
      this.startAudioMonitoring();
      
      console.log('🎤 Grabación iniciada correctamente');
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      throw error;
    }
  }

  private startAudioMonitoring(): void {
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);

    this.monitoringInterval = setInterval(async () => {
      if (!this.isListening || !this.recording) {
        if (this.monitoringInterval) clearInterval(this.monitoringInterval);
        return;
      }

      try {
        const status = await this.recording.getStatusAsync();
        
        if (status.isRecording && status.metering !== undefined) {
          const amplitude = Math.pow(10, status.metering / 10);
          this.addToCircularBuffer(amplitude);
          
          if (this.onAudioData) {
            this.onAudioData([amplitude]);
          }
        }
      } catch (error) {
        // Silenciamos errores menores de polling para evitar lag
      }
    }, 40); // Bajamos a 40ms para una respuesta instantánea
  }

  private addToCircularBuffer(value: number): void {
    this.audioBuffer.data[this.audioBuffer.currentIndex] = value;
    this.audioBuffer.currentIndex = 
      (this.audioBuffer.currentIndex + 1) % this.audioBuffer.maxSize;
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) return null;
      
      this.isListening = false;
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      
      await this.recording.stopAndUnloadAsync();
      
      const uri = this.recording.getURI();
      this.recording = null; // Limpiar referencia
      
      console.log('✅ Grabación finalizada:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Error deteniendo grabación:', error);
      return null;
    }
  }

  async playAudio(uri: string): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (error) {
      console.error('❌ Error reproduciendo audio:', error);
    }
  }

  setOnAudioData(callback: (data: number[]) => void): void {
    this.onAudioData = callback;
  }

  getStatus() {
    return {
      isListening: this.isListening,
      hasPermissions: this.hasPermissions,
    };
  }
}

export const audioService = new AudioService();
