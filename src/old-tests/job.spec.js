/* eslint-env jest */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from "must";

// ===================================================================

import { JobTest, getConfig, getMainConnection, getVmXoTestPvId } from "./util";
import { map } from "lodash";
import eventToPromise from "event-to-promise";

// ===================================================================

describe("job", () => {
  let xo;
  let serverId;
  let vmId;
  let jobIds = [];

  beforeAll(async () => {
    jest.setTimeout(10e3);
    let config;
    [xo, config] = await Promise.all([getMainConnection(), getConfig()]);

    serverId = await xo.call("server.add", config.xenServer1).catch(() => {});
    await eventToPromise(xo.objects, "finish");

    vmId = await getVmXoTestPvId(xo);
  });

  // -----------------------------------------------------------------

  afterAll(async () => {
    await xo.call("server.remove", { id: serverId });
  });

  // -----------------------------------------------------------------

  afterEach(async () => {
    await Promise.all(
      map(jobIds, jobId => xo.call("job.delete", { id: jobId }))
    );

    jobIds = [];
  });

  // -----------------------------------------------------------------

  async function createJob(params) {
    const jobId = await xo.call("job.create", params);
    jobIds.push(jobId);
    return jobId;
  }

  async function createJobTest() {
    const jobId = await JobTest(xo);
    jobIds.push(jobId);
    return jobId;
  }

  async function getJob(id) {
    const job = await xo.call("job.get", { id: id });
    return job;
  }

  // ===================================================================

  describe(".getAll()", () => {
    it("gets all available jobs", async () => {
      const jobs = await xo.call("job.getAll");
      expect(jobs).to.be.an.array();
    });
  });

  // -----------------------------------------------------------------

  describe(".get()", () => {
    let jobId;
    beforeEach(async () => {
      jobId = await createJobTest();
    });

    it("gets an existing job", async () => {
      const job = await xo.call("job.get", { id: jobId });

      expect(job.method).to.be.equal("vm.snapshot");
      expect(job.type).to.be.equal("call");
      expect(job.key).to.be.equal("snapshot");
      expect(job.paramsVector.type).to.be.equal("cross product");
    });
  });

  // -----------------------------------------------------------------

  describe(".create()", () => {
    it("creates a new job", async () => {
      const jobId = await createJob({
        job: {
          type: "call",
          key: "snapshot",
          method: "vm.snapshot",
          paramsVector: {
            type: "cross product",
            items: [
              {
                type: "set",
                values: [
                  {
                    id: vmId,
                    name: "snapshot",
                  },
                ],
              },
            ],
          },
        },
      });

      const job = await getJob(jobId);
      expect(job.method).to.be.equal("vm.snapshot");
      expect(job.type).to.be.equal("call");
      expect(job.key).to.be.equal("snapshot");
      expect(job.paramsVector.type).to.be.equal("cross product");
    });
  });

  // -----------------------------------------------------------------

  describe(".set()", () => {
    let jobId;
    beforeEach(async () => {
      jobId = createJobTest();
    });
    it("modifies an existing job", async () => {
      await xo.call("job.set", {
        job: {
          id: jobId,
          type: "call",
          key: "snapshot",
          method: "vm.clone",
          paramsVector: {
            type: "cross product",
            items: [
              {
                type: "set",
                values: [
                  {
                    id: vmId,
                    name: "clone",
                    full_copy: true,
                  },
                ],
              },
            ],
          },
        },
      });

      const job = await getJob(jobId);
      expect(job.method).to.be.equal("vm.clone");
    });
  });

  // -----------------------------------------------------------------

  describe(".delete()", () => {
    let jobId;
    beforeEach(async () => {
      jobId = await createJobTest();
    });
    it("delete an existing job", async () => {
      await xo.call("job.delete", { id: jobId });
      await getJob(jobId).then(
        () => {
          throw new Error("getJob() should have thrown");
        },
        function(error) {
          expect(error.message).to.match(/no such object/);
        }
      );
      jobIds = [];
    });
  });
});
