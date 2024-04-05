`ifElse` utility is a wrapper around `watch`.

It allows you to watch a source and execute a function whenever the condition is _truthy_, or another function whenever
the condition is _falsy_.

```ts
const myValue = ref(5)

ifElse(
  () => myValue.value > 10,
  () => console.log('myValue is greater than 10'),
  () => console.log('myValue is less than or equal to 10')
)
```
