# TypeScript

## Types' naming SHOULD be meaningful

When adding types for variants' props, try to use the component name and the prop name.

Example of a type representing the values a prop `accent` can have:

```ts
// ❌ Bad
type BtnColor = 'info' | 'success' | 'warning'
```

```ts
// ✅ Good
type ButtonAccent = 'info' | 'success' | 'warning'
```

## Types SHOULD be defined in the component

This will add better readability and avoid navigating to other files.

If necessary, the types can be exported.

## Types SHOULD NOT use `any`

Unless absolutely required by the context, types SHOULD NOT use `any`. Using `any` defeats the purpose of TypeScript's type checking and can lead to runtime errors.

Instead, consider using:

- Specific types
- `unknown` for truly unknown values
- Union types for multiple possibilities
- Generic types for flexible type-safe implementations

Example:

```ts
// ❌ Bad
function processData(data: any) {
  return data.value
}
```

```ts
// ✅ Good
function processData<T extends { value: string }>(data: T) {
  return data.value
}
```

## Non-null Assertion Operator (`!`) SHOULD NOT be used

The non-null assertion operator (`!`) overrides TypeScript's null checks and should be avoided. There is no runtime guarantee that a value won't be `null` or `undefined`, which can lead to runtime errors.

Instead:

1. Use optional chaining (`?.`)
2. Provide fallback values using nullish coalescing (`??`)
3. Add proper type guards

Example:

```ts
// This function can return `undefined`
const vm = getById(id)

// ❌ Bad
const name = vm!.name_label

// ✅ Good
const name = vm?.name_label ?? 'default value'

// ✅ Also good - best practice - early return pattern
if (vm === undefined) {
  return // Or do something else, like assigning a default value
}

const name = vm.name_label
```

Using `!` is particularly dangerous in:

- API responses
- User input
- Async operations
- DOM queries

## Always validate your typing before committing

It's a best practice to run the `type-check` command in a terminal for both `XO 6` and `XO Lite` projects during development.

For example, when working in `XO 6`, you can run this command in the root directory of `XO 6`:

```bash
yarn type-check --watch
```

The `--watch` option will ensure that any live update is taken into account.

There SHOULD be no errors when committing your changes.
