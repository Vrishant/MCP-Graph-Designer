# Broker

## Description
Broker is a Node.js backend service that acts as a client to an MCP (Model Context Protocol) server. It provides an intelligent assistant interface for energy modeling queries by leveraging OpenAI's GPT-4o-mini model and the @modelcontextprotocol/sdk. The service exposes a REST API endpoint to process user queries related to energy system inputs and generate meaningful visualizations and analyses.

## Features
- Connects to an MCP server script to process energy modeling queries.
- Uses OpenAI API for intelligent query processing.
- Provides a POST `/query` endpoint to accept and respond to user queries.
- Supports conversation reset and tool-based query processing.
- Built with Express, CORS, and dotenv for easy configuration and deployment.

## Installation

1. Clone the repository or copy the broker directory.
2. Navigate to the `broker` directory:
   ```bash
   cd broker
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the `broker` directory and set your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Usage

Start the server by running:

```bash
node index.js
```

The server will start on port 3100.

### API Endpoint

- **POST** `/query`

  Accepts a JSON body with the following structure:

  ```json
  {
    "query": "your query string",
    "data": { /* optional additional data */ }
  }
  ```

  Returns a JSON response with the processed result:

  ```json
  {
    "response": "response text or JSON string"
  }
  ```

  Example request:

  ```bash
  curl -X POST http://localhost:3100/query \
    -H "Content-Type: application/json" \
    -d '{"query": "Show me energy consumption trends"}'
  ```

## Dependencies

- [express](https://www.npmjs.com/package/express)
- [cors](https://www.npmjs.com/package/cors)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [openai](https://www.npmjs.com/package/openai)
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for accessing the GPT model.

## License

This project is licensed under the ISC License.
