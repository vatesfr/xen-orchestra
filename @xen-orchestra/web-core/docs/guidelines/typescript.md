# Typescript

## Types' naming SHOULD be meaningful

When adding types for variants' props, try to use the component name and the prop name.

Example of a type representing the values a prop `accent` can have:

❌ Bad

```ts
type BtnColor = 'info' | 'success' | 'warning'
```

✅ Good

```ts
type ButtonAccent = 'info' | 'success' | 'warning'
```

## Types SHOULD be defined in the component

This will add better readability and avoid navigating to other files.

If necessary, the types can be exported.

## Always validate your typing before committing

It's a best practice to run the `type-check` command in a terminal for both `XO 6` and `XO Lite` projects during development.

For example, when working in `XO 6`, you can run this command in the root directory of `XO 6`:

```bash
yarn type-check --watch
```

The `--watch` option will ensure that any live update is taken into account.

There SHOULD be no errors when committing your changes.
