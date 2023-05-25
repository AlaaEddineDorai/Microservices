const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

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

const resolvers = {
  Query: {
    company: (_, { id }) => {
      return new Promise((resolve, reject) => {
        clientCompanies.getCompany({ company_id: id }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.company);
          }
        });
      });
    },
    companies: () => {
      return new Promise((resolve, reject) => {
        clientCompanies.searchCompanies({}, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.companies);
          }
        });
      });
    },
    project: (_, { id }) => {
      return new Promise((resolve, reject) => {
        clientProjects.getProject({ project_id: id }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.project);
          }
        });
      });
    },
    projects: () => {
      return new Promise((resolve, reject) => {
        clientProjects.searchProjects({}, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.projects);
          }
        });
      });
    },
  },
  Mutation: {
    createCompany: (_, { id, name, description }) => {
      return new Promise((resolve, reject) => {
        clientCompanies.createCompany({ company_id: id, name: name, description: description }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.company);
          }
        });
      });
    },
    createProject: (_, { id, name, description }) => {
      return new Promise((resolve, reject) => {
        clientProjects.createProject({ project_id: id, name: name, description: description }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.project);
          }
        });
      });
    },
    updateProject: (_, { id, name, description }) => {
      return new Promise((resolve, reject) => {
        clientProjects.updateProject({ project_id: id, name: name, description: description }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.project);
          }
        });
      });
    },
    deleteProject: (_, { id }) => {
      return new Promise((resolve, reject) => {
        clientProjects.deleteProject({ project_id: id }, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.success);
          }
        });
      });
    },
  },
};

module.exports = resolvers;
