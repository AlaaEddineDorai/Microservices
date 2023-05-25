const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { MongoClient } = require('mongodb');

const projectProtoPath = 'project.proto';
const projectProtoDefinition = protoLoader.loadSync(projectProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const projectProto = grpc.loadPackageDefinition(projectProtoDefinition).project;

const PROJECT_COLLECTION = 'projects';
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'microS';

const MongoClient = require('mongodb').MongoClient;

const projectService = {
  getProject: (call, callback) => {
    const id = call.request.projectId;
    const db = MongoClient.connect(MONGO_URL).db(DB_NAME);
    const projects = db.collection(PROJECT_COLLECTION);
    projects.findOne({ id }, (err, result) => {
      if (err) {
        callback(err);
      } else if (result) {
        callback(null, { project: result });
      } else {
        callback({
          code: grpc.status.NOT_FOUND,
          details: `Project with ID ${id} not found`,
        });
      }
    });
  },
  searchProjects: (call, callback) => {
    const { query } = call.request;
    const db = MongoClient.connect(MONGO_URL).db(DB_NAME);
    const projects = db.collection(PROJECT_COLLECTION);
    projects.find({}).toArray((err, result) => {
      if (err) {
        callback(err);
      } else {
        callback(null, { projects: result });
      }
    });
  },
  createProject: (call, callback) => {
    const project = {
      id: call.request.projectId,
      title: call.request.title,
      description: call.request.description,
    };
    const db = MongoClient.connect(MONGO_URL).db(DB_NAME);
    const projects = db.collection(PROJECT_COLLECTION);
    projects.insertOne(project, (err, result) => {
      if (err) {
        callback(err);
      } else {
        callback(null, { project });
      }
    });
  },
  updateProject: (call, callback) => {
    const { projectId, title, description } = call.request;
    const db = MongoClient.connect(MONGO_URL).db(DB_NAME);
    const projects = db.collection(PROJECT_COLLECTION);
    projects.findOneAndUpdate(
      { id: projectId },
      { $set: { title, description } },
      { returnOriginal: false },
      (err, result) => {
        if (err) {
          callback(err);
        } else if (result.value) {
          callback(null, { project: result.value });
        } else {
          callback({
            code: grpc.status.NOT_FOUND,
            details: `Project with ID ${projectId} not found`,
          });
        }
      }
    );
  },
  deleteProject: (call, callback) => {
    const id = call.request.projectId;
    const db = MongoClient.connect(MONGO_URL).db(DB_NAME);
    const projects = db.collection(PROJECT_COLLECTION);
    projects.deleteOne({ id }, (err, result) => {
      if (err) {
        callback(err);
      } else if (result.deletedCount > 0) {
        callback(null, {});
      } else {
        callback({
          code: grpc.status.NOT_FOUND,
          details: `Project with ID ${id} not found`,
        });
      }
    });
  },
};

const server = new grpc.Server();
server.addService(projectProto.ProjectService.service, projectService);

const port = 50052;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
  if (err) {
    console.error('Failed to bind server:', err);
    return;
  }

  console.log(`Server is running on port ${port}`);
  server.start();
});
console.log(`Project microservice running on port ${port}`);
