import dotenv from 'dotenv';
dotenv.config();

/**
 * Calls the local Ollama LLM or a hosted API based on the environment.
 * @param {string} prompt - The prompt to send to the model.
 * @param {object} options - Options for the model (e.g. { json: true }).
 * @returns {Promise<string>} - The model's response text.
 */
export async function generateCompletion(prompt, options = {}) {
  const provider = process.env.LLM_PROVIDER || 'ollama';
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT, 10) || 180000; // default 180s for local models

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (provider === 'ollama') {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
      const model = process.env.OLLAMA_MODEL || 'llama3.2'; // Or gemma2

      const requestBody = {
        model,
        prompt,
        stream: false,
      };

      if (options.json) {
        requestBody.format = 'json';
      }

      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } else {
      // Placeholder for hosted API (e.g., OpenAI, Anthropic, or an Ollama cloud instance)
      throw new Error(`Provider '${provider}' not yet implemented.`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`LLM request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
