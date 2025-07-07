import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "bhallaServer",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

let cachedHeaders: string[] | null = null;

server.tool(
  "list-csv-headers",
  {},
  async () => {
    try {
      const response = await fetch("http://localhost:3000/csv-headers");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const headers: string[] = data.headers;

      cachedHeaders = headers; // store in cache
      console.log(headers);
      return {
        content: headers.map(header => ({
          type: "text",
          text: header,
        })),
      };
    } catch (error) {
      console.error("Error fetching csv headers:", error);
      return {
        content: [
          {
            type: "text",
            text: "Failed to load CSV headers.",
          },
        ],
      };
    }
  }
);

server.tool(
  "set-graph-axes",
  {
    xParams: z.array(z.string()).describe("Columns to use on the X axis"),
    yParams: z.array(z.string()).describe("Columns to use on the Y axis"),
  },
  async ({ xParams, yParams }) => {
    try {
      // Ensure headers are fetched
      if (!cachedHeaders) {
        const headersRes = await fetch("http://localhost:3000/csv-headers");
        if (!headersRes.ok) {
          throw new Error(`Failed to fetch headers. Status: ${headersRes.status}`);
        }

        const data = await headersRes.json();
        cachedHeaders = data.headers;
      }

      const validX = xParams.filter(param => cachedHeaders!.includes(param));
      const validY = yParams.filter(param => cachedHeaders!.includes(param));

      if (validX.length === 0 && validY.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No valid X or Y axis parameters found. Nothing was sent.",
            },
          ],
        };
      }

      await fetch("http://localhost:3000/api/set-input-params", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xParams: validX,
          yParams: validY,
        }),
      });

      return {
        content: [
          {
            type: "text",
            text: `Set X-axis: [${validX.join(", ")}], Y-axis: [${validY.join(", ")}]`,
          },
        ],
      };
    } catch (err) {
      console.error("Validation or request error:", err);
      return {
        content: [
          {
            type: "text",
            text: "Error validating or sending graph axis parameters.",
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
