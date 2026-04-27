# Guía de Comandos para Jarvis

Jarvis está diseñado para reconocer intenciones naturales. Aquí tienes cómo ampliar sus capacidades.

## Cómo agregar nuevos comandos

Para que Jarvis reconozca nuevos comandos, debes seguir estos pasos:

### 1. Actualizar el System Prompt
Edita `server/src/prompts/jarvis.system-prompt.ts` para incluir la nueva capacidad en la sección `RESPUESTAS ESPERADAS` o `REGLAS DE COMPORTAMIENTO`.

Ejemplo para agregar un comando de "traducción":
```typescript
// En jarvis.system-prompt.ts
- Para "traduce X": Traduce la frase al español y explica la gramática.
```

### 2. Actualizar la lógica del Endpoint (Opcional)
Si el comando requiere datos específicos de la base de datos (como el clima, noticias o datos del usuario), actualiza `server/src/routes/ai.routes.ts` para extraer esa información antes de llamar a Ollama.

### 3. Palabras Clave en el Frontend (Opcional)
Si quieres que el frontend reaccione visualmente a un comando (ej. abrir un modal), edita `client/src/hooks/useSpeech.ts` en la función `onresult`:

```typescript
if (text.toLowerCase().includes('abrir mapa')) {
  // Lógica para abrir componente de mapa
}
```

## Comandos actuales soportados
- **"quiero aprender palabras"**: Muestra las 20 palabras del día.
- **"podcast"**: Recomienda contenido de audio.
- **"canción"**: Recomienda música en inglés.
- **"mi progreso"**: Resumen de estadísticas.
- **"repasa"**: Inicia sesión de repaso de palabras difíciles.
