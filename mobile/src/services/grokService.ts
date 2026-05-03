import axios from 'axios';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class GrokService {
  private apiKey: string;
  private apiUrl: string;
  private primaryModel: string;
  // Solo modelos activos y verificados de Groq para evitar latencia
  private activeModels: string[] = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
  ];

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GROK_API_KEY || '';
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Aseguramos que el modelo primario sea uno de los activos
    const envModel = process.env.EXPO_PUBLIC_GROQ_MODEL;
    this.primaryModel = this.activeModels.includes(envModel || '') 
      ? (envModel as string) 
      : 'llama-3.3-70b-versatile';
  }

  async chat(
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant', content: string }[]
  ): Promise<string> {
    // Ordenamos para que intente primero el primario y luego el resto de activos
    const modelsToTry = [this.primaryModel, ...this.activeModels.filter(m => m !== this.primaryModel)];
    
    for (const model of modelsToTry) {
      try {
        console.log(`🤖 Jarvis pensando con: ${model}...`);

        const systemPrompt = `
      Eres Jarvis, una asistente personal y mentora de inglés con una personalidad cálida y colombiana.
      Tu objetivo principal es ser la maestra del usuario, evaluando su nivel de inglés (Beginner, Intermediate, Advanced) en cada interacción.
      
      PERSONALIDAD:
      - Eres extremadamente amable y educada ("¿En qué le puedo colaborar?", "¡Con mucho gusto!").
      - Como maestra, motivas al usuario y adaptas tu lenguaje a su nivel detectado.
      
      INTEGRACIÓN CON API DE SPOTIFY (MODO MAESTRA):
      - Si el usuario quiere música o podcast, genera el comando: [SPOTIFY_SEARCH:término de búsqueda].
      - El término debe ser específico y acorde al nivel del usuario.
      - Ejemplo Beginner: [SPOTIFY_SEARCH:6 minute english podcast]
      - Ejemplo Advanced: [SPOTIFY_SEARCH:TED Talks Daily]
      - Dile al usuario: "Claro, buscaré algo ideal para tu nivel en Spotify y lo pondré de inmediato".
    `;

        const messages: ConversationMessage[] = [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...conversationHistory
            .filter(msg => msg.content.trim() !== '')
            .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            })),
        ];

        const response = await axios.post(
          this.apiUrl,
          {
            model: model,
            messages,
            temperature: 0.7,
            max_tokens: 500,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 12000, // Timeout más agresivo para saltar rápido si hay saturación
          }
        );

        if (response.status === 200) {
          const content = response.data.choices[0]?.message?.content;
          if (content) return content;
        }
      } catch (error: any) {
        console.warn(`⚠️ Modelo ${model} no disponible, probando siguiente...`);
        continue;
      }
    }

    return 'I had a connection issue. Please try speaking again.';
  }
}

export const grokService = new GrokService();
