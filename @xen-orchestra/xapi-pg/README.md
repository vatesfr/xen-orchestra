# PostgreSQL schema generator for Xen Orchestra

goal: read the JSON description of XAPI and generate the corresponding SQL tables.

## Current status of the prototype

The code generates three PostgreSQL schemas:

- `test_xapi` contains the actual tables with foreign key constraints and linking tables to string the graph, the references are replaced with UUIDs;
- `test_xapi_view` contains a set of views representing the same objects but the foreign key fields are replaced with varchar UUIDs and linking tables with JSON arrays or maps;
- `test_xapi_events` just hosts the `event` table.

Some entities are not stored in the normal tables: `event` (not individually exposed), `user` (deprecated)

## Tables and Views

The generated views resemble the XAPI as much as possible.
During the storage, all the references are replaced by more durable UUIDs, sadly some rare references coming from XAPI might
be stale and impossible to convert to UUID, in that case, the field value is nulled; or the element is not added to the
Set; or the entry not added to the Map.

## Testing with Docker

There is a `docker-compose.yml` file that can be used to run the code in a Docker container with a second PostgreSQL container attached.

Set the option `pgUrl = 'postgres://user:pass@pg/data'` in xo-server/config.toml and run `docker-compose up` from here (xapi-pg), the compose file will expose the entire project (../..) to a node container, and run `yarn build` at startup before starting XO.

The xo-server instance will be available at http://localhost:8080 and the db at `postgres://localhost:5432/data`, neither should be visible outside your computer.

## Testing

The test system uses [PGLite](https://pglite.dev/), pulled from the NPM registry, so no external infrastructure is needed.
The tests run with coverage by default.

```sh
yarn workspace @xen-orchestra/xapi-pg run test-all
```

There is a command line tool for development/testing:

```sh
node packages/xen-api/cli.mjs  http://10.1.0.11 --pg-saver-url='postgresql://localhost:5432/data' root
```
