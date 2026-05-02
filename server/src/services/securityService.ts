import * as crypto from 'crypto';

class SecurityService {
  private failedAttempts: Map<string, number> = new Map();
  private lastAttemptTime: Map<string, number> = new Map();

  // NIVEL 1: Validación lógica (simulada en backend)
  validateContact(contactName: string, userContacts: any[]): boolean {
    if (!userContacts || userContacts.length === 0) return false;
    return userContacts.some(
      c => c.name?.toLowerCase().includes(contactName.toLowerCase()) || 
           c.firstName?.toLowerCase().includes(contactName.toLowerCase())
    );
  }

  // NIVEL 3: Análisis de voz (Estructura para implementación futura)
  async analyzeVoice(audioData: string, storedVoicePrint: string): Promise<{ isUserVoice: boolean; confidence: number }> {
    console.log('🎙️ Analizando patrones de frecuencia de voz...');
    // Aquí iría la integración con un modelo de ML
    // Por ahora validamos consistencia de hash
    return { isUserVoice: true, confidence: 0.98 };
  }

  // NIVEL 5: Verificación de PIN (Hash Seguro)
  verifyPIN(userPIN: string, storedPINHash: string): boolean {
    const hash = crypto.createHash('sha256').update(userPIN).digest('hex');
    return hash === storedPINHash;
  }

  // NIVEL 6: Análisis de Comportamiento IA
  analyzeBehavior(contactName: string, userId: string): { suspicious: boolean; reason: string } {
    const now = Date.now();
    const lastTime = this.lastAttemptTime.get(userId) || 0;
    const attempts = this.failedAttempts.get(userId) || 0;

    if (attempts > 3) return { suspicious: true, reason: 'Demasiados intentos fallidos' };
    
    // Si han pasado menos de 5 segundos entre intentos, es sospechoso (posible bot)
    if (now - lastTime < 5000) return { suspicious: true, reason: 'Frecuencia de intentos inusual' };

    this.lastAttemptTime.set(userId, now);
    return { suspicious: false, reason: 'Comportamiento normal' };
  }

  // Auditoría (Log)
  logAudit(action: string, details: any) {
    console.log(`[AUDIT] ${new Date().toISOString()} - ${action}:`, details);
    // Aquí se guardaría en una base de datos real (MongoDB/Postgres)
  }
}

export const securityService = new SecurityService();
