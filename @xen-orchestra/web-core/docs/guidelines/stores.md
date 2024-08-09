# Stores

Stores definition must use Pinia setup function.

State are `ref`

Getters are `computed`

Actions/Mutations are simple functions

## Naming convention

For a `foobar` store, create a `store/foobar.store.ts` then use `defineStore('foobar', setupFunc)`

## Example

```typescript
import { computed, ref } from 'vue'

export const useFoobarStore = defineStore('foobar', () => {
  const aStateVar = ref(0)
  const otherStateVar = ref(0)
  const aGetter = computed(() => aStateVar.value * 2)
  const anAction = () => (otherStateVar.value += 10)

  return {
    aStateVar,
    otherStateVar,
    aGetter,
    anAction,
  }
})
```
