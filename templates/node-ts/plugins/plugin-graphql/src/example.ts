import { GraphQLServer } from "graphql-yoga";

console.log("hello");

const typeDefs = `
  type Query {
    hello(name: String): String!
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name }) => {
      return `Hello ${name || "World"}`;
    }
  }
};

const options = {
  port: 8080,
  endpoint: "/graphql",
  subscriptions: "/subscriptions",
  playground: "/playground"
};

const server = new GraphQLServer({ typeDefs, resolvers });
server.start(options, ({ port }) => console.log(`Server is running on localhost:${port}`));