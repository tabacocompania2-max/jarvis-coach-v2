interface VoiceDetectionConfig {
  minThreshold: number;
  maxThreshold: number;
  sampleSize: number;
  silenceThreshold: number;
}

class VoiceDetector {
  private config: VoiceDetectionConfig;
  private audioBuffer: number[] = [];
  private dynamicThreshold: number;
  private isUserSpeaking: boolean = false;
  private silenceFrames: number = 0;

  constructor(config: Partial<VoiceDetectionConfig> = {}) {
    this.config = {
      minThreshold: 0.01,
      maxThreshold: 0.8,
      sampleSize: 2048,
      silenceThreshold: -40,
      ...config,
    };
    this.dynamicThreshold = this.config.minThreshold;
  }

  analyzeFrame(audioData: number[]): boolean {
    this.audioBuffer.push(...audioData);
    
    if (this.audioBuffer.length > this.config.sampleSize) {
      this.audioBuffer = this.audioBuffer.slice(-this.config.sampleSize);
    }

    if (this.audioBuffer.length < this.config.sampleSize) {
      return this.isUserSpeaking;
    }

    // Calcular RMS
    const rms = this.calculateRMS(this.audioBuffer);
    const dB = 20 * Math.log10(rms + 1e-10);
    
    // Actualizar threshold dinámico
    this.updateDynamicThreshold(dB);

    // Detectar si usuario está hablando
    const speaking = dB > this.dynamicThreshold;

    if (speaking) {
      this.silenceFrames = 0;
      this.isUserSpeaking = true;
    } else {
      this.silenceFrames++;
      
      if (this.silenceFrames > 10) {
        this.isUserSpeaking = false;
      }
    }

    return this.isUserSpeaking;
  }

  private calculateRMS(data: number[]): number {
    const sum = data.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / data.length);
  }

  private updateDynamicThreshold(currentdB: number): void {
    if (currentdB < this.config.silenceThreshold) {
      this.dynamicThreshold = this.config.minThreshold;
    } else if (currentdB > this.config.silenceThreshold + 20) {
      this.dynamicThreshold = this.config.maxThreshold * 0.7;
    } else {
      this.dynamicThreshold = 
        (this.config.minThreshold + this.config.maxThreshold) / 2;
    }
  }

  getStatus(): {
    isSpeaking: boolean;
    threshold: number;
    bufferSize: number;
  } {
    return {
      isSpeaking: this.isUserSpeaking,
      threshold: this.dynamicThreshold,
      bufferSize: this.audioBuffer.length,
    };
  }
}

export const voiceDetector = new VoiceDetector();
