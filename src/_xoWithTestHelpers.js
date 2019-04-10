import { find } from "lodash";
import Xo from "xo-lib";

export default class XoWithTestHelpers extends Xo {
  constructor(opts) {
    super(opts);
    this._tempResourcesByClass = {
      backupNg: [],
      job: [],
      user: [],
    };
  }

  async _createTempResources(class_, method, params) {
    const result = await super.call(`${class_}.${method}`, params);
    this._tempResourcesByClass[class_].push(result.id || result);
    return result;
  }

  async _deleteTempResources(class_, method, params) {
    const tempResources = this._tempResourcesByClass[class_];
    await Promise.all(
      tempResources.map(id =>
        super
          .call(`${class_}.${method}`, { id, ...params })
          .catch(error => console.error(error))
      )
    );
    tempResources.length = 0;
  }

  createUser(params) {
    return this._createTempResources("user", "create", params);
  }

  deleteAllUsers() {
    return this._deleteTempResources("user", "delete");
  }

  async getUser(id) {
    return find(await super.call("user.getAll"), { id });
  }

  createTempJob(params) {
    return this._createTempResources("job", "create", { job: params });
  }

  deleteTempJobs() {
    return this._deleteTempResources("job", "delete");
  }

  createTempBackupNgJob(params) {
    return this._createTempResources("backupNg", "createJob", params);
  }

  deleteTempBackupNgJobs() {
    return this._deleteTempResources("backupNg", "deleteJob");
  }
}
