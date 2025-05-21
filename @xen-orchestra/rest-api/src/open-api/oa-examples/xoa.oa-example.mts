export const xoaDashboard = {
  nPools: 2,
  nHosts: 5,
  backupRepositories: {
    s3: {
      size: {
        backups: 286295393792,
      },
    },
    other: {
      size: {
        available: 62630354944,
        backups: 20684251648,
        other: 66875031040,
        total: 150189637632,
        used: 87559282688,
      },
    },
  },
  resourcesOverview: {
    nCpus: 52,
    memorySize: 107374182400,
    srSize: 751123595264,
  },
  poolsStatus: {
    connected: 2,
    unreachable: 7,
    unknown: 0,
  },
  nHostsEol: 0,
  missingPatches: {
    hasAuthorization: true,
    nHostsFailed: 1,
    nHostsWithMissingPatches: 4,
    nPoolsWithMissingPatches: 2,
  },
  storageRepositories: {
    size: {
      available: 628454834176,
      other: 122641256960,
      replicated: 27504128,
      total: 751123595264,
      used: 122668761088,
    },
  },
  backups: {
    jobs: {
      disabled: 8,
      failed: 0,
      skipped: 0,
      successful: 0,
      total: 8,
    },
    issues: [],
    vmsProtection: {
      protected: 0,
      unprotected: 0,
      notInJob: 20,
    },
  },
}

export const xoaDashboardNdjson = `{"nPools":3}
{"nHosts":8}
{"resourcesOverview":{"nCpus":172,"memorySize":932007903232,"srSize":75583777292288}}
{"storageRepositories":{"size":{"available":70261423127552,"other":4844081215488,"replicated":478272949248,"total":75583777292288,"used":5322354164736}}}
{"missingPatches":{"hasAuthorization":true,"nHostsFailed":0,"nHostsWithMissingPatches":8,"nPoolsWithMissingPatches":3}}
{"backupRepositories":{"s3":{"size":{"backups":286295393792}},"other":{"size":{"available":59245199360,"backups":20684251648,"other":70260186624,"total":150189637632,"used":90944438272}}}}
{"nHostsEol":0}
{"backups":{"jobs":{"disabled":2,"failed":4,"skipped":0,"successful":0,"total":8},"issues":[{"logs":["interrupted","success","success"],"name":"test form REST ","type":"backup","uuid":"f74ccfef-8228-4d27-8d48-3c5789ce6fea"},{"logs":["failure","failure","failure"],"name":"8.2 non smart mode","type":"backup","uuid":"d78a6445-1c59-4932-9851-d6c642e46c21"},{"logs":["failure","failure","failure"],"name":"mra - test ltr ","type":"backup","uuid":"1ff1b9b7-5a1e-4826-a33e-b6bac1eb348d"},{"logs":["success","failure","success"],"name":"with healthcheck","type":"backup","uuid":"4cc33b26-466f-47e8-b38a-cd4e5e396053"}],"vmsProtection":{"protected":0,"unprotected":1,"notInJob":434}}}
{"poolsStatus":{"connected":3,"unreachable":7,"unknown":0}}`
