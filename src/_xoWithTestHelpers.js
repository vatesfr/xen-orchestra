import { find } from "lodash";
import Xo from "xo-lib";

export default class XoWithTestHelpers extends Xo {
  constructor(opts) {
    super(opts);
    this.userIds = [];
    this.jobIds = [];
    this.backupNgIds = [];
  }

  async createUser(params) {
    const userId = await super.call("user.create", params);
    this.userIds.push(userId);
    return userId;
  }

  async deleteAllUsers() {
    await Promise.all(
      this.userIds.map(id =>
        super.call("user.delete", { id }).catch(error => console.error(error))
      )
    );
    this.userIds.length = 0;
  }

  async getUser(id) {
    return find(await super.call("user.getAll"), { id });
  }

  async createTempJob(params) {
    const jobId = await super.call("job.create", { job: params });
    this.jobIds.push(jobId);
    return jobId;
  }

  async deleteTempJobs() {
    await Promise.all(
      this.jobIds.map(id =>
        super.call("job.delete", { id }).catch(error => console.error(error))
      )
    );
    this.jobIds.length = 0;
  }

  async createTempBackupNgJob(params) {
    const backupNg = await super.call("backupNg.createJob", params);
    this.backupNgIds.push(backupNg.id);
    return backupNg;
  }

  async deleteTempBackupNgJobs() {
    await Promise.all(
      this.backupNgIds.map(id =>
        super
          .call("backupNg.deleteJob", { id })
          .catch(error => console.error(error))
      )
    );
    this.backupNgIds.length = 0;
  }
}
