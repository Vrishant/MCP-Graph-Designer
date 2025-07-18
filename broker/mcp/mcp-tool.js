const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const server = new McpServer({
  name: "bhallaServer",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});


server.tool(
  "list-headers",
  "Availible headers",
  {
    bodyData: z
      .record(z.array(z.union([z.string(), z.number(), z.boolean()])))
      .describe("Leave this empty while calling for data"),
  },
  async ({ bodyData }) => {
    try {
      const result = Object.entries(bodyData).map(([key, value]) => ({
        key,
        value,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error extracting headers from bodyData:", error);
      return {
        content: [
          {
            type: "text",
            text: "Failed to extract headers from input.",
          },
        ],
      };
    }
  }
);

server.tool(
  "reply-to-user",
  "Suggest the reply format",
  {
    response: z.string().describe("NLP explanation of the response"),
    rows: z.array(z.string()).describe("Rows of the table to be displayed"),
    columns: z
      .array(z.string())
      .describe("Columns of the table to be displayed"),
    aggregate: z
      .array(z.string())
      .describe("Aggregation of the table to be displayed"),
  },
  async ({ response, rows, columns, aggregate }) => {
    try {
      const reply = {
        response,
        rows: rows || [],
        columns: columns || [],
        aggregate: aggregate || [],
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(reply),
          },
        ],
      };
    } catch (error) {
      console.error("Error replying to user:", error);
      throw new Error("Failed to reply to user.");
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Table MCP Server running on stdio");
}
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
