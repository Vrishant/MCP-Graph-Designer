# Graph Parameters Project

## Project Overview
This project provides a system for visualizing and interacting with CSV data through a combination of a Model Context Protocol (MCP) server, a backend Express server, and a frontend web interface. The system supports voice input queries, dynamic graph plotting, data filtering, and displaying data tables.

## Features

### MCP Server
- **list-csv-headers**: Fetches CSV headers from the backend.
- **show-data-table**: Requests the frontend to display the data table.
- **plot-graph**: Plots a graph using specified X and Y columns.
- **filter-and-plot**: Applies a filter on a column and plots the graph.
- **set-inputs**: Updates input fields for X and Y columns dynamically.

### Backend (Express Server)
- Serves API endpoints for processing queries and managing input parameters.
- Connects to the MCP server using MCPClient.
- Provides CSV headers from a local CSV file.
- Serves static assets and frontend files.
- Handles POST requests to `/query` for processing user queries.
- Handles POST and GET requests to `/api/set-input-params` for receiving commands and parameters from the MCP server.

### Frontend (Web Interface)
- Voice input support using the Web Speech API for query entry.
- Text input for manual query submission.
- Displays responses with markdown formatting.
- Loads and parses CSV data for visualization.
- Dynamic input fields for selecting X and Y axis columns.
- Buttons for unused columns to add to axes.
- Graph plotting using Plotly with support for filtering.
- Polls backend for commands to update UI or plot graphs.
- Button to display the data table.

## Installation and Setup

### Prerequisites
- Node.js and npm installed.
- Ensure the MCP server script path is correctly set in the environment variable `MCP_SERVER_SCRIPT`.

### Backend Setup
1. Navigate to the `mcp-web` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   node server.js
   ```
   The server listens on port 3000 by default.

### MCP Server Setup
1. Navigate to the `mcp-server` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the MCP server (ensure it is configured to connect via stdio or appropriate transport).

### Frontend Setup
- The frontend files are served statically by the backend server.
- Access the frontend by navigating to `http://localhost:3000` in a web browser.

## Usage

### Querying
- Use the voice input button 🎤 or type a query in the input box.
- Click "Send" to submit the query.
- Responses will be displayed below the input.

### Graph Plotting
- Enter comma-separated column names for X and Y axes.
- Use the buttons to add unused columns to the axes.
- Optionally, enter filter column and value to filter data.
- Click "Plot" to generate the graph.

### Data Table
- Click "Show Data" to display the CSV data in a table format.

## API Endpoints

- `POST /query`: Accepts a JSON body with a `query` string to process via MCPClient.
- `POST /api/set-input-params`: Receives commands or axis parameters from MCP server.
- `GET /api/set-input-params`: Returns the latest command or axis parameters.
- `GET /csv-headers`: Returns the headers of the CSV file.

## MCP Server Tools

- **list-csv-headers**: Retrieves CSV headers from the backend.
- **show-data-table**: Triggers frontend to display the data table.
- **plot-graph**: Sends parameters to plot a graph.
- **filter-and-plot**: Sends parameters to filter data and plot.
- **set-inputs**: Updates input fields dynamically.

## Frontend Details

- Uses Web Speech API for voice input (fallback disables if unsupported).
- Uses PapaParse to load and parse CSV data.
- Uses Plotly.js for interactive graph plotting.
- Polls backend every 2 seconds for commands to update UI or plot graphs dynamically.
- Dynamic creation of input fields for axis parameters.

## License
This project is licensed under the MIT License.

## Author
Vrishant Bhalla 