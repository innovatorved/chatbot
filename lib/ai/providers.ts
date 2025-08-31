import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

import { createGroq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';

const groq = createGroq({
  baseURL:
    'https://gateway.ai.cloudflare.com/v1/b4ca0337fb21e846c53e1f2611ba436c/chatbot-ai/groq',
});

export const myProvider = customProvider({
  languageModels: {
    'chat-llama3.3-70b-versatile': groq('llama-3.3-70b-versatile'),
    'chat-gemini-2.0-flash-lite': google('gemini-2.0-flash-lite'),
    'chat-gemini-1.5-flash-8b': google('gemini-1.5-flash-8b'),
    'chat-gemini-2.0-flash': google('gemini-2.0-flash'),
    'chat-gemini-2.0-flash-search': google('gemini-2.0-flash', {
      useSearchGrounding: true,
    }),
    'chat-model-reasoning': wrapLanguageModel({
      model: groq('qwen/qwen3-32b'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': google('gemini-1.5-flash-8b'),
    'openai/gpt-oss-20b': groq('openai/gpt-oss-20b'),
    'openai/gpt-oss-120b': wrapLanguageModel({
      model: groq('openai/gpt-oss-120b'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
  },
  imageModels: {},
});
