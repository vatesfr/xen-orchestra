# `useRanked` composable

This composable helps sort items based on a predefined ranking order.

It takes an array of items and a ranking order, and returns a computed sorted array according to the ranking.

## Usage

### Signature 1: Sorting ranks directly

```ts
const sortedRanks = useRanked(ranks, ranking)
```

|           | Required | Type                        | Default | Description                                                |
| --------- | :------: | --------------------------- | ------- | ---------------------------------------------------------- |
| `ranks`   |    ✓     | `MaybeRefOrGetter<TRank[]>` |         | The array of ranks to sort                                 |
| `ranking` |    ✓     | `TRank[]`                   |         | The array of ranks ordered from highest to lowest priority |

#### Return value

|               | Type                   | Description                                                     |
| ------------- | ---------------------- | --------------------------------------------------------------- |
| `sortedRanks` | `ComputedRef<TRank[]>` | A computed array of ranks sorted according to the ranking order |

- Ranks are sorted based on their position in the `ranking` array (lower index = higher priority)
- Ranks not found in the `ranking` array are placed after all defined ranks in their original order

#### Example: Sorting priority levels

```ts
import { useRanked } from '@core/composables/ranked.composable'
import { ref } from 'vue'

// Priority levels in random order
const currentPriorities = ref(['high', 'medium', 'low', 'critical', 'low', 'medium', 'high'])

// Define the ranking order (from highest to lowest priority)
const priorityRanking = ['critical', 'high', 'medium', 'low']

// Sort priorities according to the ranking
const sortedPriorities = useRanked(currentPriorities, priorityRanking)

// sortedPriorities.value will be:
// ['critical', 'high', 'high', 'medium', 'medium', 'low', 'low']
```

### Signature 2: Sorting items by their rank

```ts
const sortedItems = useRanked(items, getRank, ranking)
```

|           | Required | Type                        | Default | Description                                                |
| --------- | :------: | --------------------------- | ------- | ---------------------------------------------------------- |
| `items`   |    ✓     | `MaybeRefOrGetter<TItem[]>` |         | The array of items to sort                                 |
| `getRank` |    ✓     | `(item: TItem) => TRank`    |         | A function to extract rank from an item                    |
| `ranking` |    ✓     | `TRank[]`                   |         | The array of ranks ordered from highest to lowest priority |

#### Return value

|               | Type                   | Description                                       |
| ------------- | ---------------------- | ------------------------------------------------- |
| `sortedItems` | `ComputedRef<TItem[]>` | A computed array of items sorted by their ranking |

- Items are sorted based on their rank in the `ranking` array (lower index = higher priority)
- Items with ranks not found in the `ranking` array are placed after all ranked items in their original order

#### Example: Sorting tasks by priority

```ts
import { useRanked } from '@core/composables/ranked.composable'
import { ref } from 'vue'

// Tasks with different priorities
const tasks = ref([
  {
    id: 1,
    title: 'Fix login bug',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Update documentation',
    priority: 'low',
  },
  {
    id: 3,
    title: 'Server outage',
    priority: 'critical',
  },
  {
    id: 4,
    title: 'Refactor components',
    priority: 'medium',
  },
  {
    id: 5,
    title: 'Design review',
    priority: 'medium',
  },
])

// Define the ranking order (from highest to lowest priority)
const priorityRanking = ['critical', 'high', 'medium', 'low']

// Sort tasks by priority according to the ranking
const sortedTasks = useRanked(tasks, task => task.priority, priorityRanking)

// sortedTasks.value will be:
// [
//   { id: 3, title: 'Server outage', priority: 'critical' },
//   { id: 1, title: 'Fix login bug', priority: 'high' },
//   { id: 4, title: 'Refactor components', priority: 'medium' },
//   { id: 5, title: 'Design review', priority: 'medium' },
//   { id: 2, title: 'Update documentation', priority: 'low' }
// ]
```
