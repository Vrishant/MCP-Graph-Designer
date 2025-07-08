const express = require("express");
const cors = require("cors");
const { mcpClient } = require("./mcp/mcp-client.js");



let latestAxisParams = null;

const app = express();
const port = 3100;
const MCP_SERVER_SCRIPT = "./mcp/mcp-tool.js";

app.use(cors());
app.use(express.json());

// let mcpClient = mcpClient;

async function startMCPClient() {
  // mcpClient = new MCPClient();
  
 
  try {
    await mcpClient.connectToServer(MCP_SERVER_SCRIPT);
    console.log("MCP Client connected to server");
  } catch (err) {
    console.error("Failed to connect MCP Client to server:", err);
    process.exit(1);
  }
}

app.post("/query", async (req, res) => {
  if (!mcpClient) {
    return res.status(500).json({ error: "MCP Client not initialized" });
  }

  const body = req.body;

  if (!body || !body.query || typeof body.query !== "string") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const query = body.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Invalid query" });
  }
  console.log("Received query:", query);
  try {
    const response = await mcpClient.processQuery(query);
    const responseText =
      typeof response === "string" ? response : JSON.stringify(response);
    res.json({ response: responseText });
  } catch (err) {
    console.error("Error processing query:", err);
    res.status(500).json({ error: "Error processing query" });
  }
});

app.listen(port, () => {
  console.log(`MCP Web backend listening at http://localhost:${port}`);
  startMCPClient();
});
