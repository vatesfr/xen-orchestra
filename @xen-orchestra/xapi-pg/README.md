# Postgres schema generator for Xen Orchestra

goal: read the JSON description of XAPI and generate the corresponding SQL tables.

## Current status of the prototype

The code generates three PostgreSQL schemas:

- `test_xapi` contains the actual tables with foreign key constraints and linking tables to string the graph, the references are replaced with UUIDs,
- `test_xapi_view` contains a set of views representing the same objects but the foreign key fields are replaced with varchar UUIDs and linking tables with JSON arrays or maps,
- `test_xapi_events` just hosts the `event` table.

Some entities are not stored in the normal tables: `event` (not individually exposed), `user` (deprecated)

## Tables and Views

The generated views resemble the XAPI as much as possible.
During the storage, all the references are replaced by more durable UUIDs, sadly some rare references coming from XAPI might
be stale and impossible to convert to UUID, in that case, the field value is nulled; or the element is not added to the
Set; or the entry not added to the Map.
