# useArrayRemovedItemsHistory composable

This composable allows you to keep a history of each removed item of an array.

## Usage

```typescript
const myArray = ref([]);
const history = useArrayRemovedItemsHistory(myArray)

myArray.push('A'); // myArray = ['A']; history = []
myArray.push('B'); // myArray = ['A', 'B']; history = []
myArray.shift(); // myArray = ['B']; history = ['A']
```

You can limit the number of items to keep in history:

```typescript
const myArray = ref([]);
const history = useArrayRemovedItemsHistory(myArray, 30);
```

Be careful when using an array of objects which is likely to be replaced (instead of being altered):

```typescript
const myArray = ref([]);
const history = useArrayRemovedItemsHistory(myArray);
myArray.value = [{ id: 'foo' }, { id: 'bar' }];
myArray.value = [{ id: 'bar' }, { id: 'baz' }]; // history = [{ id: 'foo' }, { id: 'bar' }]
```

In this case, `{ id: 'bar' }` is detected as removed since in JavaScript `{ id: 'bar' } !== { id: 'bar' }`.

You must therefore use an identity function as third parameter to return the value to be used to detect deletion:

```typescript
const myArray = ref<{ id: string }[]>([]);
const history = useArrayRemovedItemsHistory(myArray, undefined, (item) => item.id);
myArray.value = [{ id: 'foo' }, { id: 'bar' }];
myArray.value = [{ id: 'bar' }, { id: 'baz' }]; // history = [{ id: 'foo' }]
```
