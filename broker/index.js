const express = require("express");
const cors = require("cors");
const { MCPClient } = require("./mcp/mcp-client.js");

const app = express();
const port = 3100;
const MCP_SERVER_SCRIPT = "./mcp/mcp-tool.js";

app.use(cors());
app.use(express.json());

const sessions = new Map();


function getNow() {
  return Date.now();
}

// async function getClientForSession(sessionId) {
//   if (!sessions.has(sessionId)) {
//     const client = new MCPClient();
//     await client.connectToServer(MCP_SERVER_SCRIPT);
//     sessions.set(sessionId, client);
//   }
//   return sessions.get(sessionId);
// }

async function getClientForSession(sessionId) {
  let session = sessions.get(sessionId);
  if (!session) {
    const client = new MCPClient();
    await client.connectToServer(MCP_SERVER_SCRIPT);
    session = { client, lastUsed: getNow() };
    sessions.set(sessionId, session);
  } else {
    session.lastUsed = getNow(); // Update usage timestamp
  }
  return session.client;
}

setInterval(async () => {
  const now = getNow();
  const maxIdleMs = 10 * 60 * 1000; // 10 minutes
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastUsed > maxIdleMs) {
      console.log(`Cleaning up idle session: ${sessionId}`);
      await session.client.cleanup(); // Disconnect
      sessions.delete(sessionId);
    }
  }
}, 60 * 1000); // check every 60 seconds

app.post("/query", async (req, res) => {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  const body = req.body;
  if (!body || !body.query || typeof body.query !== "string") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const client = await getClientForSession(sessionId);
    let response = await client.processQuery(body);

    // Sanitize response by removing markdown code block backticks and trimming
    response = response.trim();
    if (response.startsWith("```")) {
      const firstNewline = response.indexOf("\n");
      if (firstNewline !== -1) {
        response = response.substring(firstNewline + 1);
      }
      if (response.endsWith("```")) {
        response = response.substring(0, response.length - 3);
      }
      response = response.trim();
    }
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(response);
    } catch (parseError) {
      console.error("Error parsing response JSON:", parseError);
      return res.status(500).json({ error: "Invalid JSON response from MCPClient" });
    }
    res.json(jsonResponse);
  } catch (err) {
    console.error("Error processing query:", err);
    res.status(500).json({ error: "Error processing query" });
  }
});

app.listen(port, () => {
  console.log(`MCP Web backend listening at http://localhost:${port}`);
});