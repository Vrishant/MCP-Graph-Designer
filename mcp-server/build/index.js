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
let cachedHeaders = null;
server.tool("list-csv-headers", {}, async () => {
    try {
        const response = await fetch("http://localhost:3000/csv-headers");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const headers = data.headers;
        cachedHeaders = headers; // store in cache
        console.log(headers);
        return {
            content: headers.map(header => ({
                type: "text",
                text: header,
            })),
        };
    }
    catch (error) {
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
});
// server.tool(
//   "set-graph-axes",
//   {
//     xParams: z.array(z.string()).describe("Columns to use on the X axis"),
//     yParams: z.array(z.string()).describe("Columns to use on the Y axis"),
//   },
//   async ({ xParams, yParams }) => {
//     try {
//       // Ensure headers are fetched
//       if (!cachedHeaders) {
//         const headersRes = await fetch("http://localhost:3000/csv-headers");
//         if (!headersRes.ok) {
//           throw new Error(`Failed to fetch headers. Status: ${headersRes.status}`);
//         }
//         const data = await headersRes.json();
//         cachedHeaders = data.headers;
//       }
//       const validX = xParams.filter(param => cachedHeaders!.includes(param));
//       const validY = yParams.filter(param => cachedHeaders!.includes(param));
//       if (validX.length === 0 && validY.length === 0) {
//         return {
//           content: [
//             {
//               type: "text",
//               text: "No valid X or Y axis parameters found. Nothing was sent.",
//             },
//           ],
//         };
//       }
//       await fetch("http://localhost:3000/api/set-input-params", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           xParams: validX,
//           yParams: validY,
//         }),
//       });
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Set X-axis: [${validX.join(", ")}], Y-axis: [${validY.join(", ")}]`,
//           },
//         ],
//       };
//     } catch (err) {
//       console.error("Validation or request error:", err);
//       return {
//         content: [
//           {
//             type: "text",
//             text: "Error validating or sending graph axis parameters.",
//           },
//         ],
//       };
//     }
//   }
// );
// Tool: showDataTable (no parameters, just triggers the frontend to show the table)
server.tool("show-data-table", {}, async () => {
    try {
        await fetch("http://localhost:3000/api/set-input-params", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ function: "showDataTable" }),
        });
        return {
            content: [
                {
                    type: "text",
                    text: "Requested to display the data table.",
                },
            ],
        };
    }
    catch (err) {
        console.error("Error calling showDataTable:", err);
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to request data table display.",
                },
            ],
        };
    }
});
// Tool: plotGraph
server.tool("plot-graph", {
    xCols: z.array(z.string()).describe("X-axis column names"),
    yCols: z.array(z.string()).describe("Y-axis column names"),
}, async ({ xCols, yCols }) => {
    try {
        await fetch("http://localhost:3000/api/set-input-params", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                function: "plotGraph",
                params: { xCols, yCols },
            }),
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Plotting graph using X: [${xCols.join(", ")}], Y: [${yCols.join(", ")}]`,
                },
            ],
        };
    }
    catch (err) {
        console.error("Error in plotGraph tool:", err);
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to plot graph.",
                },
            ],
        };
    }
});
// Tool: filterAndPlot
server.tool("filter-and-plot", {
    xCols: z.array(z.string()),
    yCols: z.array(z.string()),
    filterCol: z.string(),
    filterVal: z.string(),
}, async ({ xCols, yCols, filterCol, filterVal }) => {
    try {
        await fetch("http://localhost:3000/api/set-input-params", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                function: "filterAndPlot",
                params: { xCols, yCols, filterCol, filterVal },
            }),
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Filtering and plotting with filter ${filterCol}=${filterVal}, X: [${xCols.join(", ")}], Y: [${yCols.join(", ")}]`,
                },
            ],
        };
    }
    catch (err) {
        console.error("Error in filterAndPlot tool:", err);
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to apply filter and plot.",
                },
            ],
        };
    }
});
// Tool: setInputs
server.tool("set-inputs", {
    xCols: z.array(z.string()),
    yCols: z.array(z.string()),
}, async ({ xCols, yCols }) => {
    try {
        await fetch("http://localhost:3000/api/set-input-params", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                function: "setInputs",
                params: { xCols, yCols },
            }),
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Input fields updated with X: [${xCols.join(", ")}], Y: [${yCols.join(", ")}]`,
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
