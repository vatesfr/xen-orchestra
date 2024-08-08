# useRouteQuery Composable

`useRouteQuery` is a composable that synchronizes a route query parameter with a reactive reference.

## Usage

### Basic Usage

```typescript
const query = useRouteQuery('search')
```

In this example, if URL contains `?search=hello`, then `query.value` will be `'hello'`.

If you set `query.value = 'world'`, then the URL will be replaced with `?search=world`.

### Default Value

You can provide a default value if the query parameter is not present in the URL.

```typescript
const foo = useRouteQuery('foo', { defaultQuery: 'bar' })
```

In this case, if the URL does not contain `foo` query parameter, then `foo.value` will be `'bar'`.

If the URL contains `?foo=`, then `foo.value` will be an empty string.

Setting `foo.value = 'baz'` will update the URL to `?foo=baz`.

Setting the reference back to its default value (in this case
`foo.value = 'bar'`) will remove the query parameter from the URL.

### Advanced Usage with Custom Data Type

By default, the data type is `string`. That means that if the query is `?count=42`, then
`query.value` will be the string `'42'`.

You can use transformers to convert the query string to a custom data type.

```typescript
const count = useRouteQuery<number>('count', {
  toData: query => parseInt(query, 10),
  toQuery: data => data.toString(),
  defaultQuery: '0',
})
```

Now if the URL contains `?count=42`, then `count.value` will be the number `42`.

### Working with objects or arrays

The data reference is watched deeply, so you can use objects or arrays as values and alter them directly.

```typescript
const users = useRouteQuery<Set<string>>('users', {
  toData: query => new Set(value ? value.split(',') : undefined),
  toQuery: data => Array.from(value).join(','),
})
```

In this case, calling `users.value.add('Foo').add('Bar')` will update the URL to `?users=foo,bar`.
