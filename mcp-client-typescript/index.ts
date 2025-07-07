import { OpenAI } from "openai";
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/index.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
// import readline from "readline/promises";
import dotenv from "dotenv";
import path from "path";
import process from "process";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

export class MCPClient {
  private messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a helpful assistant connected to tools. Do not call graph tool until you have obtained the headers`,
    },
  ];
  private mcp: Client;
  private openai: OpenAI;
  private transport: StdioClientTransport | null = null;
  private tools: ChatCompletionTool[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    this.mcp = new Client({ name: "mcp-openai-client", version: "1.0.0" });
  }

  reset() {
    this.messages = [
      {
        role: "system",
        content: `You are a helpful assistant connected to tools. Do not call graph tool until you have obtained the headers.`,
      },
    ];
  }


  async connectToServer(serverScriptPath: string) {
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
  }

  private trimMessages(messages: ChatCompletionMessageParam[], maxMessages: number = 10) {
    const sysMsgs = messages.filter(m => m.role === "system");
    const rest = messages.filter(m => m.role !== "system").slice(-maxMessages);
    return [...sysMsgs, ...rest];
  }

  async processQuery(query: string) {

    if (query.trim().toLowerCase() === "reset") {
        this.reset();
        return "Conversation history has been reset.";
      }

    this.messages.push({
      role: "user",
      content: query,
    });

    // let messages: ChatCompletionMessageParam[] = [
    //   {
    //     role: "user",
    //     content: query,
    //   },
    // ];

    //Single tool call

    // const completion = await this.openai.chat.completions.create({
    //   model: "gpt-4o-mini", // Or "gpt-4-turbo" / "gpt-3.5-turbo"
    //   messages: this.messages,
    //   tools: this.tools,
    //   max_tokens: 500,
    //   tool_choice: "auto",
    // });

    // const responseMessage = completion.choices[0].message;

    // const finalText: string[] = [];

    // // let finalReply = "";

    // if (responseMessage.tool_calls) {
    //   for (const toolCall of responseMessage.tool_calls) {
    //     const toolName = toolCall.function.name;
    //     const args = JSON.parse(toolCall.function.arguments || "{}");

    //     const result = await this.mcp.callTool({
    //       name: toolName,
    //       arguments: args,
    //     });

    //     finalText.push(`[Tool: ${toolName}]`);
    //     if (Array.isArray(result.content)) {
    //       for (const item of result.content) {
    //         if (typeof item === "object" && item !== null && "type" in item && item.type === "text") {
    //           finalText.push((item as { type: string; text: string }).text);
    //         }
    //       }
    //     } else {
    //       finalText.push(String(result.content)); // fallback
    //     }
        

    //     this.messages.push(responseMessage);

    //     const toolContent = JSON.stringify(result.content);
    //     const truncatedToolContent = toolContent.length > 1000
    //       ? toolContent.slice(0, 1000) + "... [truncated]"
    //       : toolContent;

    //     this.messages.push({
    //       role: "tool",
    //       tool_call_id: toolCall.id,
    //       content: truncatedToolContent,
    //     });

    //     this.messages = this.trimMessages(this.messages);

    //     const secondResponse = await this.openai.chat.completions.create({
    //       model: "gpt-4o-mini",
    //       messages: this.messages,
    //       max_tokens: 500,
    //     });

    //     const finalResponse = secondResponse.choices[0].message;
    //     // if (finalResponse.content) {
    //     //   finalText.push(finalResponse.content);
    //     // }
    //     if (finalResponse.content) {
    //       this.messages.push(finalResponse); // store final reply too
    //       finalText.push(finalResponse.content);
    //     }

    //   }
    // } else if (responseMessage.content) {
    //   finalText.push(responseMessage.content);
    // }

    // return finalText.join("\n");


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
        console.log(`Calling tool: ${toolName} with args:`, args);
    
        const result = await this.mcp.callTool({
          name: toolName,
          arguments: args,
        });
    
        const toolContent = JSON.stringify(result.content);
        const truncatedToolContent = toolContent.length > 1000
          ? toolContent.slice(0, 1000) + "... [truncated]"
          : toolContent;
    
        this.messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: truncatedToolContent,
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
}

async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node index.ts <path_to_server_script>");
    return;
  }

  const mcpClient = new MCPClient();
  try {
    await mcpClient.connectToServer(path.resolve(process.argv[2]));
  } finally {
    await mcpClient.cleanup();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
});
