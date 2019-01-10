import { find } from "lodash";
import Xo from "xo-lib";

export default class XoWithTestHelpers extends Xo {
  constructor(opts) {
    super(opts);
    this.userIds = [];
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
}
