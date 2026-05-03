import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callGroqAI(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  systemPrompt: string,
  model: string = process.env.AI_MODEL || 'llama-3.3-70b-versatile'
): Promise<string> {
  console.log(`--- Calling Groq with model: ${model} ---`);
  
  try {
    // Formatear el historial para el formato de chat de Groq/OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages as any,
      model: model,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';
    console.log('Groq responded successfully');
    
    return response;
  } catch (error: any) {
    console.error('Groq API Error:', error.message);
    throw new Error(`Failed to get response from Groq: ${error.message}`);
  }
}

export async function rankYouTubeResults(
  intent: string,
  results: Array<{ title: string; description: string; channelTitle: string }>,
  type: 'music' | 'podcast' | 'lesson'
): Promise<number> {
  const prompt = `Actúa como un selector experto de contenido educativo y musical.
  El usuario quiere: "${intent}"
  Tipo de contenido buscado: ${type}
  
  Analiza estos 5 resultados de YouTube y elige el índice (0-4) del que mejor se adapte.
  Criterios:
  - Si es 'lesson', prioriza canales educativos y títulos que indiquen enseñanza.
  - Si es 'podcast', busca videos largos (no shorts) y canales de podcasts reales.
  - Si es 'music', busca el video oficial o audio de alta calidad.
  
  RESULTADOS:
  ${results.map((r, i) => `${i}: Título: ${r.title} | Canal: ${r.channelTitle} | Desc: ${r.description.substring(0, 100)}`).join('\n')}
  
  Responde ÚNICAMENTE con el número del índice (ej: 0). No des explicaciones.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // Usamos un modelo rápido para esto
      temperature: 0,
      max_tokens: 10,
    });

    const index = parseInt(completion.choices[0]?.message?.content || '0');
    return isNaN(index) ? 0 : index;
  } catch (error) {
    console.error('Ranking Error:', error);
    return 0;
  }
}
