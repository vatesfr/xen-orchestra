/* eslint-env jest */

import { omit } from "lodash";
import { testConnection, xo } from "../util";

const simpleUser = {
  email: "wayne3@vates.fr",
  password: "batman",
};

describe("user :", () => {
  describe("create a user", () => {
    describe.each([
      [
        "without permission",
        {
          email: "wayne1@vates.fr",
          password: "batman1",
        },
      ],
      [
        "with permission",
        {
          email: "wayne2@vates.fr",
          password: "batman2",
          permission: "user",
        },
      ],
    ])("successfully", (title, data) => {
      it(title, async () => {
        const userId = await xo.createUser(data);
        expect(userId).toBeString();
        expect(omit(await xo.getUser(userId), "id")).toMatchSnapshot();
        await testConnection({
          credentials: {
            email: data.email,
            password: data.password,
          },
        });
      });
    });

    describe.each([
      ["without email", { password: "batman" }],
      ["without password", { email: "wayne@vates.fr" }],
    ])("failed", (title, data) => {
      it(title, async () => {
        await expect(xo.createUser(data)).rejects.toMatchSnapshot();
      });
    });

    it("failed with an email already used", async () => {
      await xo.createUser(simpleUser);
      await expect(xo.createUser(simpleUser)).rejects.toMatchSnapshot();
    });
  });
});
