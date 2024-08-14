# REST API

## How to handle a new record type from the REST API?

1. Create the new record type in the `types/xo/<name>.type.ts`

   Define the `id` as a branded property (e.g.: `id: Branded<'vm'>`)

   Define the relations with `id` property of the relational record (e.g.: `pool: XoPool['id']`)

2. Add the REST API configuration for this record in `utils/xo-api-definition.util.ts`
3. Create the store in `stores/xo-rest-api/<name>.store.ts`

   For a basic store:

   ```typescript
   const config = createXoStoreConfig('<name>')

   return createSubscribableStoreContext(config, {})
   ```
