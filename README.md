# Chatbot v2

A modern, feature-rich chatbot application powered by multiple AI models with an intuitive user interface.

## Getting Started

To get started with this project, you will need to:

1.  Install the dependencies: `bun install`
2.  Set up your environment variables by creating a `.env` file. See the "Environment Variables" section below for more details.
3.  Run database migrations: `bun run db:migrate`
4.  Start the development server: `bun run dev`
5.  Open [http://localhost:3000](http://localhost:3000) in your browser


## Available Models

This application supports the following AI models:

| Model ID | Name | Description |
| --- | --- | --- |
| `chat-gemini-2.5-flash-lite` | **Gemini 2.5 Flash-Lite** (Default) | Fastest and most cost-efficient, optimized for high-volume tasks |
| `chat-gemini-2.5-flash` | **Gemini 2.5 Flash** | Balanced performance with advanced reasoning and native multimodality |
| `chat-gemini-3-flash-preview` | **Gemini 3 Flash Preview** | Next-generation model optimized for ultra-fast multimodal performance |
| `chat-gemini-2.0-flash` | **Gemini 2.0 Flash** | Reliable workhorse model with a huge context window |
| `chat-gemini-2.5-flash-search` | **Gemini 2.5 Flash + Web Search** | Grounded in Google Search for real-time information retrieval |
| `chat-model-reasoning` | **Qwen-3 32b** | Advanced reasoning for complex logical tasks |
| `openai/gpt-oss-20b` | **GPT-OSS 20b** | Optimized open-source model hosted on Groq |
| `openai/gpt-oss-120b` | **GPT-OSS 120b** | Large-scale open-source model with reasoning middleware |


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Vercel AI SDK](https://sdk.vercel.ai/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Powered by various AI providers (Google AI, Groq, OpenAI)
