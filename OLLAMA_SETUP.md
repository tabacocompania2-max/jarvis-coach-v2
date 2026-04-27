# Configuración de Ollama para Jarvis

Si estás configurando Jarvis en un nuevo entorno, sigue estos pasos:

## 1. Instalación de Ollama

### Windows
1. Descarga el instalador desde [ollama.com](https://ollama.com/download/windows).
2. Ejecuta el `.exe` y sigue las instrucciones.
3. Abre una terminal (PowerShell) y verifica: `ollama --version`.

### macOS
1. Descarga desde [ollama.com](https://ollama.com/download/mac).
2. Arrastra a Aplicaciones.
3. Ejecuta Ollama desde el Launchpad.

### Linux
Ejecuta el siguiente comando:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## 2. Descargar el Modelo
Jarvis utiliza **Mistral 7B** por su equilibrio entre velocidad y calidad.
Ejecuta en tu terminal:
```bash
ollama pull mistral
```

## 3. Verificar Servidor
Asegúrate de que Ollama esté corriendo en segundo plano. Puedes probarlo abriendo en tu navegador:
`http://localhost:11434`

Deberías ver un mensaje: "Ollama is running".
