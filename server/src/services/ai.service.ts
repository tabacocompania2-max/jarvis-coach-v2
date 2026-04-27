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
