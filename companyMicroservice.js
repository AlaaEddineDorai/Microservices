const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const companyProtoPath = 'company.proto';
const companyProtoDefinition = protoLoader.loadSync(companyProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const companyProto = grpc.loadPackageDefinition(companyProtoDefinition).company;

const COMPANY_COLLECTION = 'companies';
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'microS';

const MongoClient = require('mongodb').MongoClient;

const companyService = {
  getCompany: (call, callback) => {
    const id = call.request.companyId;
    const db = MongoClient.connect(MONGO_URL).db(DB_NAME);
    const companies = db.collection(COMPANY_COLLECTION);
    companies.findOne({ id }, (err, result) => {
      if (err) {
        callback(err);
      } else if (result) {
        callback(null, { company: result });
      } else {
        callback({
          code: grpc.status.NOT_FOUND,
          details: `Company with ID ${id} not found`,
        });
      }
    });
  },
  searchCompanies: (call, callback) => {
    const { query } = call.request;
    const db = MongoClient.connect(MONGO_URL).db(DB_NAME);
    const companies = db.collection(COMPANY_COLLECTION);
    companies.find({}).toArray((err, result) => {
      if (err) {
        callback(err);
      } else {
        callback(null, { companies: result });
      }
    });
  },
  createCompany: (call, callback) => {
    const { companyId, name, description } = call.request;
    const db = MongoClient.connect(MONGO_URL).db(DB_NAME);
    const companies = db.collection(COMPANY_COLLECTION);
    companies.insertOne({ id: companyId, name, description }, (err, result) => {
      if (err) {
        callback(err);
      } else {
        callback(null, { company: result.ops[0] });
      }
    });
  },
};

const server = new grpc.Server();
server.addService(companyProto.CompanyService.service, companyService);

const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
  if (err) {
    console.error('Failed to bind server:', err);
    return;
  }

  console.log(`Server is running on port ${port}`);
  server.start();
});
console.log(`Company microservice running on port ${port}`);
