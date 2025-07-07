# MCP Project

## Project Overview

This project consists of three main components working together to provide a Model Context Protocol (MCP) based AI assistant with a web interface:

- **mcp-client-typescript**: A TypeScript client that connects to the MCP server, processes user queries using OpenAI's API and MCP tools.
- **mcp-server**: An MCP server implemented in TypeScript that exposes tools for interacting with CSV data and setting graph axes parameters.
- **mcp-web**: A web backend and frontend built with Express.js that serves static assets, provides API endpoints, and runs the MCP client to connect to the MCP server.

The system enables querying and visualization of data through a web interface, leveraging AI capabilities and custom MCP tools.

---

## Architecture Overview

```
User <--> Web Frontend (mcp-web/public) <--> Web Backend (mcp-web/server.js) <--> MCP Client (mcp-client-typescript) <--> MCP Server (mcp-server)
```

- The **web backend** serves static files and API endpoints.
- The **MCP client** connects to the MCP server and processes queries.
- The **MCP server** provides tools to fetch CSV headers and set graph axes, interacting with the web backend.

---

## Prerequisites

- Node.js (v16 or later recommended)
- npm (Node package manager)
- Python (if using Python server scripts)
- OpenAI API key (set in environment variables)

---

## Installation

### 1. mcp-client-typescript

```bash
cd mcp-client-typescript
npm install
```

### 2. mcp-server

```bash
cd mcp-server
npm install
```

### 3. mcp-web

```bash
cd mcp-web
npm install
```

---

## Running the Project

### Start the MCP Server

```bash
cd mcp-server
npm run build
node build/index.js
```

### Start the MCP Client

```bash
cd mcp-client-typescript
npm run build
node build/index.js ../mcp-server/build/index.js
```

### Start the Web Backend

```bash
cd mcp-web
npm start
```

The web backend will be available at `http://localhost:3000`.

---

## API Endpoints

### POST `/query`

- Accepts a JSON body with a `query` string.
- Forwards the query to the MCP client for processing.
- Returns the response from the MCP client.

### POST `/api/set-input-params`

- Accepts JSON body with `xParams` and `yParams` arrays.
- Sets the graph axes parameters.

### GET `/api/set-input-params`

- Returns the latest set input parameters.

### GET `/csv-headers`

- Returns the headers of the CSV file used for graphing.

---

## MCP Server Tools

### `list-csv-headers`

- Fetches and caches CSV headers from the web backend.

### `set-graph-axes`

- Validates and sets X and Y axis parameters for graphing.
- Sends parameters to the web backend.

---

## Technologies Used

- Node.js
- TypeScript
- Express.js
- OpenAI API
- Model Context Protocol SDK
- dotenv
- axios
- cors
- csv-parser
- zod

---

## License

ISC

---

## Author

Vrishant Bhalla