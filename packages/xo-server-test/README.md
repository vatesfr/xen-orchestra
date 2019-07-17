# xo-test [![Build Status](https://travis-ci.org/vatesfr/xo-test.png?branch=master)](https://travis-ci.org/vatesfr/xo-test)

> Test client for Xo-Server

## Adding a test

### Organization

```
src
├─ user
|   ├─ __snapshots__
|   |     └─ index.spec.js.snap 
|   └─ index.spec.js
├─ job
¦   └─ index.spec.js
¦
¦
├─ _xoConnection.js
└─ util.js
```

The tests can describe xo methods or scenarios:  
```javascript
import xo from "../_xoConnection";

describe("user", () => {

  // testing a method
  describe(".set()", () => {
    it("sets an email", async () => {
      // some tests using xo methods and helpers from _xoConnection.js
      const id = await xo.createTempUser(SIMPLE_USER);
      expect(await xo.call("user.set", params)).toBe(true);
      expect(await xo.getUser(id)).toMatchSnapshot({
        id: expect.any(String),
      });
    });
  });
      
  // testing a scenario
  test("create two users, modify a user email to be the same with the other and fail trying to connect them", () => {
    /* some tests */
  });

});
```

### Best practices

- The test environment must remain the same before and after each test:  
  * each resource created must be deleted  
  * existing resources should not be altered

- Make a sentence for the title of the test. It must be clear and consistent.

- If the feature you want to test is not implemented : write it and skip it, using `it.skip()`.

- Take values ​​that cover the maximum of testing possibilities.

- If you make tests which keep track of large object, it is better to use snapshots.  

- `_xoConnection.js` contains helpers to create temporary resources and to interface with XO.  
  You can use it if you need to create resources which will be automatically deleted after the test:  
  ```javascript
  import xo from "../_xoConnection";

  describe(".create()", () => {
    it("creates a user without permission", async () => {
      // The user will be deleted automatically at the end of the test
      const userId = await xo.createTempUser({
        email: "wayne1@vates.fr",
        password: "batman1",
      });
      expect(await xo.getUser(userId)).toMatchSnapshot({
        id: expect.any(String),
      });
    });
  });
  ```

  The available helpers:  
  * `createTempUser(params)`  
  * `getUser(id)`  
  * `createTempJob(params)`  
  * `createTempBackupNgJob(params)`  
  * `createTempVm(params)`  
  * `getSchedule(predicate)`  

## Usage

- Before running the tests, you have to create a config file for xo-server-test.  
  ```
  > cp sample.config.toml ~/.config/xo-server-test/config.toml
  ```
  And complete it.

- To run the tests:  
  ```
  > npm ci
  > yarn test
  ```

  You get all the test suites passed (`PASS`) or failed (`FAIL`).  
  ```
  > yarn test
  yarn run v1.9.4
  $ jest
   PASS  src/user/user.spec.js
   PASS  src/job/job.spec.js
   PASS  src/backupNg/backupNg.spec.js

  Test Suites: 3 passed, 3 total
  Tests:       2 skipped, 36 passed, 38 total
  Snapshots:   35 passed, 35 total
  Time:        7.257s, estimated 8s
  Ran all test suites.
  Done in 7.92s.
  ```

- You can run only tests related to changed files, and review the failed output by using: `> yarn test --watch`

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-test/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](http://vates.fr)
