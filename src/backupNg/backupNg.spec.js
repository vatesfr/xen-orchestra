/* eslint-env jest */

import { omit } from "lodash";

import config from "../_config";
import randomId from "../_randomId";
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
      expect(omit(backupNg, "id", "userId")).toMatchSnapshot();
      expect(backupNg.userId).toBe(xo._user.id);
    });

    it("creates a new backup job with schedules", async () => {
      const scheduleTempId = randomId();
      const { id: jobId } = await xo.createTempBackupNgJob({
        ...defaultBackupNg,
        schedules: {
          [scheduleTempId]: {
            name: "scheduleTest",
            cron: "0 * * * * *",
          },
        },
        settings: {
          ...defaultBackupNg.settings,
          [scheduleTempId]: { snapshotRetention: 1 },
        },
      });

      const backupNgJob = await xo.call("backupNg.getJob", { id: jobId });

      expect(omit(backupNgJob, "id", "userId", "settings")).toMatchSnapshot();
      expect(backupNgJob.userId).toBe(xo._user.id);

      const settingKeys = Object.keys(backupNgJob.settings);
      expect(settingKeys.length).toBe(2);
      const scheduleId = settingKeys.find(key => key !== "");
      expect(backupNgJob.settings[scheduleId]).toEqual({
        snapshotRetention: 1,
      });

      const schedule = await xo.call("schedule.get", { id: scheduleId });
      expect(omit(schedule, "id", "jobId")).toMatchSnapshot();
      expect(schedule.jobId).toBe(jobId);
    });
  });
});
