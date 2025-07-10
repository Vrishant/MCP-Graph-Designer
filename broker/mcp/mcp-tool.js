const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
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
  "Availible headers to be placed in rows and columns",
  {
    bodyData: z.record(z.array(z.union([z.string(), z.number(), z.boolean()]))).describe("Leave this empty while calling for data")
  },
  async ({ bodyData }) => {
    try {
      const headers = Object.keys(bodyData);
      cachedHeaders = headers;

      return {
        content: headers.map((header) => ({
          type: "text",
          text: header,
        })),
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



server.tool("suggest-inputs", {
  rows: z.array(z.string()),
  columns: z.array(z.string()),
}, async ({ rows, columns }) => {
  try {
      return {
          content: [
              {
                  type: "text",
                  text: `Input fields updated with X: [${rows.join(", ")}], Y: [${columns.join(", ")}]`,
              },
          ],
      };
  }
  catch (err) {
      console.error("Error in setInputs tool:", err);
      return {
          content: [
              {
                  type: "text",
                  text: "Failed to update input fields.",
              },
          ],
      };
  }
});


server.tool(
  "list-subheaders",
  "Returns subheaders for a given header name",
  {
    headerName: z.string().describe("Name of the header to get subheaders for"),
    bodyData: z.record(z.array(z.union([z.string(), z.number(), z.boolean()]))).describe("Leave this empty while calling for data")
  },
  async ({ headerName, bodyData }) => {
    try {
      const subheaders = bodyData[headerName];
      if (!subheaders) {
        return {
          content: [
            {
              type: "text",
              text: `No subheaders found for header: ${headerName}`,
            },
          ],
        };
      }
      return {
        content: subheaders.map((subheader) => ({
          type: "text",
          text: subheader.toString(),
        })),
      };
    } catch (error) {
      console.error("Error fetching subheaders:", error);
      return {
        content: [
          {
            type: "text",
            text: "Failed to fetch subheaders.",
          },
        ],
      };
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
