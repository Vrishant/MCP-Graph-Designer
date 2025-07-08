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



// server.tool("list-headers", {}, async () => {
//   try {
//     const headers = [
//       "commodity",
//       "process",
//       "year",
//       "timeslice",
//       "scenario",
//       "region",
//       "unit",
//       "varbl",
//       "attribute",
//     ];
//     cachedHeaders = headers; // store in cache
//     console.log(headers);
//     return {
//       content: headers.map((header) => ({
//         type: "text",
//         text: header,
//       })),
//     };
//   } catch (error) {
//     console.error("Error fetching csv headers:", error);
//     return {
//       content: [
//         {
//           type: "text",
//           text: "Failed to load CSV headers.",
//         },
//       ],
//     };
//   }
// });


server.tool(
  "list-headers",
  {},
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Table MCP Server running on stdio");
}
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
