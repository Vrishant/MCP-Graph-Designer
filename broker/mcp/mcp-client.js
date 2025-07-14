const OpenAI = require("openai");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const {
  StdioClientTransport,
} = require("@modelcontextprotocol/sdk/client/stdio.js");
const dotenv = require("dotenv");
const process = require("process");

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

class MCPClient {
  messages = [
    {
      role: "system",
      content: `
      You are a data visualization assistant. When users ask for a plot or table, ALWAYS respond in the following JSON format:

      {
        "response": "<natural language explanation>",
        "rows": ["<row dimension>"],
        "columns": ["<column dimension>"],
        "aggregate": ["<Unused Headers>"]
      }
      ` 
    },
  ];
  mcp;
  openai;
  transport = null;
  tools = [];
  constructor(userApiKey) {
    if (!userApiKey) {
      throw new Error("User API key is required for MCPClient.");
    }
    try {
      this.openai = new OpenAI({
        apiKey: userApiKey,
      });

      this.mcp = new Client({ name: "mcp-openai-client", version: "1.0.0" });
    } catch (error) {
      console.error("Error in MCPClient constructor:", error);
    }
  }
  reset() {
    this.messages = [
      {
        role: "system",
        content: `
            You are a data visualization assistant. When users ask for a plot or table, ALWAYS respond in the following JSON format:

            {
              "response": "<natural language explanation>",
              "rows": ["<row dimension>"],
              "columns": ["<column dimension>"],
              "aggregate": ["<Unused Headers>"]
            }
            `
      },
    ];
  }
  async connectToServer(serverScriptPath) {
    const isJs = serverScriptPath.endsWith(".js");
    const isPy = serverScriptPath.endsWith(".py");
    if (!isJs && !isPy) {
      throw new Error("Server script must be a .js or .py file");
    }
    const command = isPy
      ? process.platform === "win32"
        ? "python"
        : "python3"
      : process.execPath;
    this.transport = new StdioClientTransport({
      command,
      args: [serverScriptPath],
    });
    await this.mcp.connect(this.transport);
    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
    console.log(
      "Connected to server with tools:",
      this.tools.map((t) => t.function.name)
    );
    console.log("Using the User API key to interact with the server");
  }
  trimMessages(messages, maxMessages = 10) {
    const sysMsgs = messages.filter((m) => m.role === "system");
    const rest = messages
      .filter((m) => m.role !== "system")
      .slice(-maxMessages);
    return [...sysMsgs, ...rest];
  }



  async processQuery(BD) {
    console.log("Recieved Body Data:",BD);
    const bodyData=BD.data;
    const query=BD.query;
    if (query.trim().toLowerCase() === "reset") {
      this.reset();
      return "Conversation history has been reset.";
    }
    this.messages.push({
      role: "user",
      content: query,
    });

    let response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: this.messages,
      tools: this.tools,
      max_tokens: 500,
      tool_choice: "auto",
    });
    while (response.choices[0].message.tool_calls) {
      const toolCalls = response.choices[0].message.tool_calls;
      this.messages.push(response.choices[0].message);
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const toolsNeedingBodyData = new Set(["list-headers", "list-subheaders", "expose-dataset"]);
        if (toolsNeedingBodyData.has(toolName)) {
          args.bodyData = bodyData;
        }

        console.log(`Calling tool: ${toolName} with args:`, args);

        const result = await this.mcp.callTool({
          name: toolName,
          arguments: args,
        });

        const toolContent = JSON.stringify(result.content);
        this.messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolContent,
        });
      }

      this.messages = this.trimMessages(this.messages);
      response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: this.messages,
        tools: this.tools,
        max_tokens: 500,
        tool_choice: "auto",
      });
    }
    const finalMessage = response.choices[0].message;
    console.log("Final assistant response:", finalMessage.content);
    if (finalMessage.content) {
      this.messages.push(finalMessage);
      return finalMessage.content;
    }
    return "[No response content received]";
  }
  async cleanup() {
    await this.mcp.close();
  }

  // New method to call tool with body.data directly
  // async callToolWithBodyData(toolName, bodyData) {
  //   try {
  //     const result = await this.mcp.callTool({
  //       name: toolName,
  //       arguments: { data: bodyData },
  //     });
  //     console.log(`Tool ${toolName} response:`, result);
  //     return result;
  //   } catch (error) {
  //     console.error(`Error calling tool ${toolName} with body.data:`, error);
  //     throw error;
  //   }
  // }
}

var mcpClient;
async function main() {
  console.log("Running MCP server");
  //   if (process.argv.length < 3) {
  //     console.log("Usage: node index.ts <path_to_server_script>");
  //     return;
  //   }

  mcpClient = new MCPClient();

  //   try {
  //     await mcpClient.connectToServer(path.resolve(process.argv[2]));
  //   } finally {
  //     await mcpClient.cleanup();
  //   }
}
main().catch((err) => {
  console.error("Fatal error:", err);
});

module.exports = { MCPClient };
