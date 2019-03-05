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

    it("creates a new backup job with schedules", async () => {
      const scheduleTempId = "scheduleTempId";
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

      let scheduleId;
      for (const key in backupNgJob.settings) {
        if (key !== "") {
          expect(backupNgJob.settings[key]).toEqual({ snapshotRetention: 1 });
          scheduleId = key;
        }
      }

      expect(typeof backupNgJob).toBe("object");
      expect(omit(backupNgJob, "id", "userId", "settings")).toMatchSnapshot();
      expect(backupNgJob.userId).toBe(xo._user.id);

      const schedule = await xo.call("schedule.get", { id: scheduleId });
      expect(omit(schedule, "id", "jobId")).toMatchSnapshot();
      expect(schedule.jobId).toBe(jobId);
    });
  });
});
