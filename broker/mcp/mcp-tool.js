const {
  McpServer
} = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  z
} = require("zod");

const server = new McpServer({
  name: "bhallaServer",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "expose-dataset",
  "Use this to see all the avaible data to the user", 
  {
    bodyData: z.record(z.array(z.union([z.string(), z.number(), z.boolean()]))).describe("Leave this empty while calling for data")
  },
  async ({ bodyData }) => {
    try {
      const formattedText = Object.entries(bodyData)
        .map(([key, values]) => `**${key}**: ${values.join(", ")}`)
        .join("\n");

      return {
        content: [{
          type: "text",
          text: `**📊 Available Dataset Dimensions:**\n\n${formattedText}`,
        }, ],
      };
    } catch (err) {
      console.error("Error in expose-dataset tool:", err);
      return {
        content: [{
          type: "text",
          text: "❌ Failed to expose dataset. Please try again.",
        }, ],
      };
    }
  }
);

server.tool(
  "list-headers",
  "Availible headers to be placed in rows and columns", {
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
        content: [{
          type: "text",
          text: "Failed to extract headers from input.",
        }, ],
      };
    }
  }
);

// server.tool("suggest-inputs", {
//   rows: z.array(z.string()),
//   columns: z.array(z.string()),
// }, async ({ rows, columns }) => {
//   try {
//       return {
//           content: [
//               {
//                   type: "text",
//                   text: `Input fields updated with X: [${rows.join(", ")}], Y: [${columns.join(", ")}]`,
//               },
//           ],
//       };
//   }
//   catch (err) {
//       console.error("Error in setInputs tool:", err);
//       return {
//           content: [
//               {
//                   type: "text",
//                   text: "Failed to update input fields.",
//               },
//           ],
//       };
//   }
// });

server.tool("define-format",
  "Defines a specific format for the comaprison graph",
  {},
  async () => {
    try {
      return {
        content: [{
          type: "text",
          text: `The correct format for a comparison graph typically includes the following components:

                1. Rows and Columns:
                  - Rows represent one dimension or category.
                  - Columns represent another dimension or category.
                  - Each cell at the intersection of a row and column contains the data point for comparison.

                2. Headers:
                  - The top row contains column headers describing each column category.
                  - The first column contains row headers describing each row category.

                3. Subheaders (Optional):
                  - Subheaders can be used to group related columns or rows for better organization.

                4. Data Points:
                  - Each cell contains a value (numeric, boolean, or string) representing the comparison metric.

                5. Metadata (Optional):
                  - Additional information such as units, data source, or formatting instructions.

                Example format (JSON-like):

                {
                  "rows": ["Category A", "Category B", "Category C"],
                  "columns": ["Metric 1", "Metric 2", "Metric 3"],
                  "data": [
                    [10, 20, 30],
                    [15, 25, 35],
                    [20, 30, 40]
                  ],
                  "metadata": {
                    "units": "units",
                    "source": "Data source description"
                  }
                }

                This format allows clear comparison across multiple dimensions and metrics.`
        }],
      };
    } catch {
      return {
        content: [{
          type: "text",
          text: "Failed"
        }],
      };
    }
  }
)

server.tool(
  "list-subheaders",
  "Returns subheaders for a given header name", {
    headerName: z.string().describe("Name of the header to get subheaders for"),
    bodyData: z.record(z.array(z.union([z.string(), z.number(), z.boolean()]))).describe("Leave this empty while calling for data")
  },
  async ({ headerName, bodyData }) => {
    try {
      const subheaders = bodyData[headerName];
      if (!subheaders) {
        return {
          content: [{
            type: "text",
            text: `No subheaders found for header: ${headerName}`,
          }, ],
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
        content: [{
          type: "text",
          text: "Failed to fetch subheaders.",
        }, ],
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