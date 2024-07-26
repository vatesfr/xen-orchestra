# `useItemCounter`

This composable is meant to count items based on given filters then output the categorized count.

## Usage

```typescript
const collection = [
  { id: 'a', size: 'S' },
  { id: 'b', size: 'S' },
  { id: 'c', size: 'XL' },
  { id: 'd', size: 'M' },
  { id: 'e', size: 'L' },
  { id: 'f', size: 'S' },
]

const count = useItemCounter(collection, {
  small: item => item.size === 'S',
  medium: item => item.size === 'M',
})

console.log(count.small) // 3
console.log(count.medium) // 1
console.log(count.$other) // 2
```
