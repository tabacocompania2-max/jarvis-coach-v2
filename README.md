# English Learning Coach (ELC) - Jarvis

Asistente de inglés personal 24/7 para Carlos. Una PWA diseñada para aprender inglés fluido en 6 meses mediante interacción por voz e IA.

## 🚀 Tecnologías
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** PostgreSQL (Railway)
- **IA:** Ollama (Mistral 7B) corre localmente en `localhost:11434`
- **Voz:** Web Speech API

## 📂 Estructura del Proyecto
- `/client`: Aplicación frontend (React)
- `/server`: API Backend (Express)

## 🛠️ Instalación y Ejecución

### 1. Requisitos
- Node.js (v18+)
- Ollama (con modelo Mistral instalado: `ollama run mistral`)
- PostgreSQL (opcional para desarrollo local, recomendado Railway)

### 2. Configuración del Cliente
```bash
cd client
npm install
npm run dev
```

### 3. Configuración del Servidor
```bash
cd server
npm install
# Crea un archivo .env con:
# PORT=3001
# DATABASE_URL=tu_url_de_railway
npm run dev # (Pendiente configurar script en package.json)
```

## 📝 Roadmap
- [x] Estructura base del proyecto
- [x] UI Premium (Jarvis Theme)
- [ ] Integración de Web Speech API
- [ ] Conexión con Ollama API
- [ ] Sistema de Autenticación Firebase
- [ ] Implementación de lógica de lecciones diarias
