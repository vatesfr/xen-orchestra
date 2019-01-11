/* eslint-env jest */

import { forOwn, keyBy, omit } from "lodash";
import { testConnection, xo } from "../util";

const simpleUser = {
  email: "wayne3@vates.fr",
  password: "batman",
};

const withData = (data, fn) =>
  forOwn(data, (data, title) => {
    it(title, () => fn(data));
  });

describe("user", () => {
  describe(".create() :", () => {
    withData(
      {
        "creates a user without permission": {
          email: "wayne1@vates.fr",
          password: "batman1",
        },
        "creates a user with permission": {
          email: "wayne2@vates.fr",
          password: "batman2",
          permission: "user",
        },
      },
      async data => {
        const userId = await xo.createUser(data);
        expect(typeof userId).toBe("string");
        expect(omit(await xo.getUser(userId), "id")).toMatchSnapshot();
        await testConnection({
          credentials: {
            email: data.email,
            password: data.password,
          },
        });
      }
    );

    withData(
      {
        "fails trying to create a user without email": { password: "batman" },
        "fails trying to create a user without password": {
          email: "wayne@vates.fr",
        },
      },
      async data => {
        await expect(xo.createUser(data)).rejects.toMatchSnapshot();
      }
    );

    it("fails trying to create a user with an email already used", async () => {
      await xo.createUser(simpleUser);
      await expect(xo.createUser(simpleUser)).rejects.toMatchSnapshot();
    });
  });

  describe(".getAll() :", () => {
    it("gets all the users created", async () => {
      const userId1 = await xo.createUser({
        email: "wayne4@vates.fr",
        password: "batman",
        permission: "user",
      });
      const userId2 = await xo.createUser({
        email: "wayne5@vates.fr",
        password: "batman",
        permission: "user",
      });
      let users = await xo.call("user.getAll");
      expect(Array.isArray(users)).toBe(true);
      users = keyBy(users, "id");
      expect([
        omit(users[userId1], "id"),
        omit(users[userId2], "id"),
      ]).toMatchSnapshot();
    });
  });

  describe(".delete() :", () => {
    it("deletes a user successfully with id", async () => {
      const userId = await xo.call("user.create", simpleUser);
      expect(await xo.call("user.delete", { id: userId })).toBe(true);
      expect(await xo.getUser(userId)).toBe(undefined);
    });

    it("fails trying to delete a user with a nonexistent user", async () => {
      await expect(
        xo.call("user.delete", { id: "nonexistentId" })
      ).rejects.toMatchSnapshot();
    });

    it("fails trying to delete itself", async () => {
      await expect(
        xo.call("user.delete", { id: xo._user.id })
      ).rejects.toMatchSnapshot();
    });
  });
});
