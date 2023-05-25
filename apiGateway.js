const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { MongoClient } = require('mongodb');

const resolvers = require('./resolvers');
const typeDefs = require('./schema');

const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'microS';
const COMPANY_COLLECTION = 'companies';
const PROJECT_COLLECTION = 'projects';

const app = express();
app.use(bodyParser.json());

const client = new MongoClient(MONGO_URL);

const server = new ApolloServer({ typeDefs, resolvers });

server.start().then(() => {
  app.use(
    cors(),
    bodyParser.json(),
    expressMiddleware(server),
  );
});

client.connect((err) => {
  if (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
  console.log('Connected to MongoDB successfully');
});

const companyProtoPath = 'company.proto';
const projectProtoPath = 'project.proto';

const companyProtoDefinition = protoLoader.loadSync(companyProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const projectProtoDefinition = protoLoader.loadSync(projectProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const companyProto = grpc.loadPackageDefinition(companyProtoDefinition).company;
const projectProto = grpc.loadPackageDefinition(projectProtoDefinition).project;
const clientCompanies = new companyProto.CompanyService('localhost:50051', grpc.credentials.createInsecure());
const clientProjects = new projectProto.ProjectService('localhost:50052', grpc.credentials.createInsecure());

app.get('/companies', async (req, res) => {
  const db = client.db(DB_NAME);
  const companies = db.collection(COMPANY_COLLECTION);
  try {
    const result = await companies.find().toArray();
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/companies', (req, res) => {
  const { id, name, description } = req.body;
  clientCompanies.createCompany({ company_id: id, name: name, description: description }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.company);
    }
  });
});

app.get('/companies/:id', async (req, res) => {
  const id = req.params.id;
  const db = client.db(DB_NAME);
  const companies = db.collection(COMPANY_COLLECTION);
  try {
    const result = await companies.findOne({ id });
    if (result) {
      res.json(result);
    } else {
      res.status(404).send('Company not found');
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/projects', (req, res) => {
  clientProjects.searchProjects({}, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.projects);
    }
  });
});

app.get('/projects/:id', (req, res) => {
  const id = req.params.id;
  clientProjects.getProject({ projectId: id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.project);
    }
  });
});

app.post('/projects', async (req, res) => {
  const { id, name, description } = req.body;
  const db = client.db(DB_NAME);
  const projects = db.collection(PROJECT_COLLECTION);
  try {
    const result = await projects.insertOne({ id, name, description });
    res.json(result.ops[0]);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/projects/:id', (req, res) => {
  const id = req.params.id;
  const { name, description } = req.body;
  clientProjects.updateProject({ project_id: id, name, description }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.project);
    }
  });
});

app.delete('/projects/:id', async (req, res) => {
  const id = req.params.id;
  const db = client.db(DB_NAME);
  const projects = db.collection(PROJECT_COLLECTION);
  try {
    const result = await projects.deleteOne({ id });
    if (result.deletedCount === 0) {
      res.status(404).send('Project not found');
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
