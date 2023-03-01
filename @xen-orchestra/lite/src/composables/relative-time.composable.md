# useRelativeTime composable

## Usage

```ts
const relativeTime = useRelativeTime(fromDate, toDate);

console.log(relativeTime.value); // 3 days 27 minutes 10 seconds ago
```

# Reactivity

Both arguments can be `Ref`

```ts
const now = useNow();
const relativeTime = useRelativeTime(fromDate, now); // Value will be updated each time `now` changes
```
