import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "compatibility-mcp",
  version: "1.0.0"
});

server.registerTool(
  "product_compatibility_lookup",
  {
    title: "Product Compatibility Lookup",
    description:
      "Checks the ReplaceIt database for a verified compatible replacement product.",
    inputSchema: {
      brand: z.string().describe("Brand of the appliance or product"),
      model: z.string().describe("Model number of the appliance or product"),
      replacement_type: z
        .string()
        .optional()
        .describe("Type of replacement product, such as refrigerator filter")
    }
  },
  async ({ brand, model, replacement_type }) => {
    const url = new URL(
      "https://replaceit-api.tmcallen41.workers.dev/api/compatibility"
    );

    url.searchParams.set("brand", brand);
    url.searchParams.set("model", model);

    if (replacement_type) {
      url.searchParams.set("replacement_type", replacement_type);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: `ReplaceIt compatibility lookup failed with status ${response.status}.`
          }
        ],
        isError: true
      };
    }

    const result = await response.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        name: "compatibility-mcp",
        status: "online",
        mcp_endpoint: "/mcp"
      });
    }

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "compatibility-mcp"
      });
    }

    return createMcpHandler(server)(request, env, ctx);
  }
};
