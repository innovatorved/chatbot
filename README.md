# Chatbot v2

A modern, feature-rich chatbot application powered by multiple AI models with an intuitive user interface.

## Getting Started

To get started with this project, you will need to:

1.  Install the dependencies: `pnpm install`
2.  Set up your environment variables by creating a `.env` file. See the "Environment Variables" section below for more details.
3.  Run database migrations: `pnpm run db:migrate`
4.  Start the development server: `pnpm run dev`
5.  Open [http://localhost:3000](http://localhost:3000) in your browser


## Available Models

This application supports the following AI models:

| Model ID | Name | Description |
| --- | --- | --- |
| `chat-gemini-2.5-flash-lite` | **Gemini 2.5 Flash-Lite** (Default) | Best for high volume, cost efficient tasks. Ultra fast and optimized for cost-efficiency and high throughput |
| `chat-gemini-2.5-flash` | **Gemini 2.5 Flash** | Best for fast performance on everyday tasks. Offers well-rounded capabilities with advanced thinking and native multimodality |
| `chat-gemini-2.0-flash` | **Gemini 2.0 Flash** | Second generation workhorse model with 1 million token context window and multimodal capabilities |
| `chat-gemini-2.5-flash-search` | **Gemini 2.5 Flash + Web Search** | Gemini 2.5 Flash with Google Search grounding for real-time information retrieval and enhanced accuracy |
| `chat-model-reasoning` | **Qwen-3 32b** | Uses advanced reasoning and thinking for complex tasks |
| `openai/gpt-oss-20b` | **GPT-OSS 20b** | Open source model by OpenAI, hosted on Groq |
| `openai/gpt-oss-120b` | **GPT-OSS 120b** | Open source model by OpenAI, hosted on Groq |


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Vercel AI SDK](https://sdk.vercel.ai/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Powered by various AI providers (Google AI, Groq, OpenAI)
