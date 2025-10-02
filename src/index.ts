import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import { PrismaClient } from "@prisma/client";
import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import type PrismaTypes from "@pothos/plugin-prisma/generated";

const prisma = new PrismaClient({});

const builder = new SchemaBuilder<{ PrismaTypes: PrismaTypes }>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
    onUnusedQuery: process.env.NODE_ENV === "production" ? null : "warn",
  },
});

builder.prismaObject("User", {
  description: "유저",
  include: { userInfo: true },
  fields: (t) => ({
    id: t.exposeID("id"),
    // joinedAt: t.expose("joinedAt", { description: "가입한 일시", type: "DateTime" })
    userInfo: t.relation("userInfo", { description: "유저 정보" }),
    userAuths: t.relation("userAuths", {
      description: "유저 인증",
      args: { userId: t.arg.int({ description: "유저 아이디" }) },
      query: ({ userId }, ctx) => (userId ? { where: { userId } } : {}),
    }),
    name: t.string({
      resolve: (src) => src.userInfo?.name,
    }),
  }),
});

builder.prismaObject("UserInfo", {
  description: "유저 정보",
  fields: (t) => ({
    userId: t.exposeID("userId", { description: "유저 아이디" }),
    name: t.exposeString("name", { description: "이름" }),
    phone: t.exposeString("phone", { description: "휴대폰 번호" }),
  }),
});

builder.prismaObject("UserAuth", {
  description: "유저 인증",
  fields: (t) => ({
    userId: t.exposeInt("userId"),
    loginType: t.exposeString("loginType"),
    loginId: t.exposeString("loginId"),
  }),
});

builder.queryType({
  fields: (t) => ({
    selectUserList: t.prismaField({
      description: "유저 조회",
      type: "User",
      resolve: async (query, src, args, ctx, info) =>
        await prisma.user.findFirst({ ...query }),
    }),
    selectUserInfoList: t.prismaField({
      type: "UserInfo",
      resolve: async (query, src, args, ctx, info) =>
        await prisma.userInfo.findFirst({
          ...query,
        }),
    }),
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
