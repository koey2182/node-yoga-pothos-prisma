import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import { PrismaClient } from "@prisma/client";
import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";

const prisma = new PrismaClient({});

const builder = new SchemaBuilder({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
    onUnusedQuery: process.env.NODE_ENV === "production" ? null : "warn",
  },
});

builder.queryType({
  fields: (t) => ({
    hello: t.string({
      args: { name: t.arg.string() },
      resolve: (src, { name }) => `hello, ${name || "world"}!`,
    }),
  }),
});

const yoga = createYoga({ schema: builder.toSchema() });

const server = createServer(yoga);

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Visit http://localhost:${port}/graphql`);
});
