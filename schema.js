const { gql } = require('apollo-server-express');

const typeDefs = `#graphql
  type Company {
    id: String!
    name: String!
    description: String!
  }

  type Project {
    id: String!
    name: String!
    description: String!
  }

  type Query {
    company(id: String!): Company
    companies: [Company]
    project(id: String!): Project
    projects: [Project]
  }

  type Mutation {
    createCompany(id: String!, name: String!, description: String!): Company
    updateProject(id: String!, name: String!, description: String!): Project
    deleteProject(id: String!): Boolean
  }
`;

module.exports = typeDefs;
