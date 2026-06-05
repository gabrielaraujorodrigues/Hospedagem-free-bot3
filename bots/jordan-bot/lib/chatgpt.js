// Stub chatgpt.js — replace with real API keys if desired
export const perplexity = {
  chat: async (messages) => {
    return { choices: [{ message: { content: 'Chatbot indisponível. Configure uma API key.' } }] }
  }
}

export async function askGPT(query) {
  return 'Chatbot indisponível. Configure uma API key.'
}

export default { perplexity, askGPT }
