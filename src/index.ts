import SchemaBuilder from "@pothos/core";
import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";

const builder = new SchemaBuilder({});

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
