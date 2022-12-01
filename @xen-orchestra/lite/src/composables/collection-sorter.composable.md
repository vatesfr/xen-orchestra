# useCollectionSorter composable

## Usage

```typescript
const { sorts, addSort, removeSort, compareFn, toggleSortDirection } =
  useCollectionSorter(options);

const sortedCollection = computed(() => myCollection.sort(compareFn));
addSort("name", true);
addSort("age", false);
```

## Options

### `queryStringParam`

This option allows to activate the URL Query String support.

```typescript
const { addSort } = useCollectionSorter({ queryStringParam: "sort" });
addSort("name", true); // Will update the URL with ?sort=name:1
```

### Initial sorts

This option allows to set some initial sorts.

Use `key` for ascending sort and `-key` for descending sort.

```typescript
const {
  /* ... */
} = useCollectionSorter({
  initialSorts: ["name", "-age"],
});
```

When using the `initialSorts` option with the `queryStringParam` option,
`initialSorts` will only be applied if no query string parameter is defined in the URL.
