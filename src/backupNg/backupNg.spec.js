/* eslint-env jest */

import { omit } from "lodash";

import config from "../_config";
import { xo } from "../util";

describe("backupNg", () => {
  let defaultBackupNg;

  beforeAll(() => {
    defaultBackupNg = {
      name: "default-backupNg",
      mode: "full",
      vms: {
        id: config.vmIdXoTest,
      },
      settings: {
        "": {
          reportWhen: "always",
        },
      },
    };
  });

  describe(".create() :", () => {
    it("creates a new backup job without schedules", async () => {
      const backupNg = await xo.createTempBackupNgJob(defaultBackupNg);
      expect(typeof backupNg).toBe("object");
      expect(omit(backupNg, "id", "userId")).toMatchSnapshot();
      expect(backupNg.userId).toBe(xo._user.id);
    });
  });
});
