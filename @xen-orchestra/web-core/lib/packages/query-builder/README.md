# Query Builder Package

A powerful, type-safe Vue.js composable library for building dynamic filter interfaces. Query Builder enables developers to create flexible, user-friendly query systems with minimal boilerplate code.

**Built on Complex Matcher**: Query Builder leverages the [Complex Matcher](https://npmjs.org/package/complex-matcher) package under the hood, which provides advanced search syntax parsing and filtering capabilities.

## Getting Started

### Installation

The Query Builder package is part of the core library and can be imported directly:

```typescript
import { useQueryBuilder } from '@core/packages/query-builder/use-query-builder'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'
```

### Quick Start Example

Here's a minimal example to filter a list of products:

```typescript
import { ref } from 'vue'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'

// 1. Define your data type
interface Product {
  id: string
  name: string
  price: number
  category: string
}

// 2. Create your data source
const products = ref<Product[]>([
  { id: '1', name: 'Laptop', price: 999, category: 'Electronics' },
  { id: '2', name: 'Desk', price: 299, category: 'Furniture' },
  { id: '3', name: 'Mouse', price: 29, category: 'Electronics' },
])

// 3. Define the filterable schema
const schema = useQueryBuilderSchema<Product>({
  '': { label: 'Any property', operators: { contains: { label: 'Contains' } } },
  name: { label: 'Product Name', operators: { contains: { label: 'Contains' } } },
  category: {
    label: 'Category',
    operators: { is: { label: 'Is', values: { Electronics: 'Electronics', Furniture: 'Furniture' } } },
  },
  price: { label: 'Price', operators: { greaterThan: { label: '>' }, lessThan: { label: '<' } } },
})

// 4. Use the filter composable
const { items: filteredProducts, filter } = useQueryBuilderFilter('products', () => products.value)
```

**Alternative: Using Schema Utilities**

The example above manually defines operators for each property. For a cleaner approach, use the schema utilities:

```typescript
import { ref } from 'vue'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema'

interface Product {
  id: string
  name: string
  price: number
  category: string
}

const products = ref<Product[]>([
  { id: '1', name: 'Laptop', price: 999, category: 'Electronics' },
  { id: '2', name: 'Desk', price: 299, category: 'Furniture' },
  { id: '3', name: 'Mouse', price: 29, category: 'Electronics' },
])

// Simpler schema definition with utilities
const schema = useQueryBuilderSchema<Product>({
  '': useStringSchema('Any property'),
  name: useStringSchema('Product Name'),
  category: useStringSchema('Category', { Electronics: 'Electronics', Furniture: 'Furniture' }),
  price: useNumberSchema('Price'),
})

const { items: filteredProducts, filter } = useQueryBuilderFilter('products', () => products.value)
```

## Glossary

### Core Terms

**Filter Expression**
A human-readable query string that describes which items to keep, using Complex Matcher syntax. Example: `name:Laptop` or `price>100 category:Electronics`

**Schema**
The configuration that defines which properties can be filtered, what operators are available for each property, and what values are allowed. It acts as a blueprint for valid queries.

**Property**
A field from your data object that users can filter by. Examples: `name`, `price`, `category`. In TypeScript, nested properties use dot notation (e.g., `address.city`), but in filter queries they're accessed with colon notation (e.g., `address:city`).

**Operator**
A condition type that defines how to compare a property value. Examples: `contains`, `is`, `greaterThan`, `startsWith`, `matchesRegex`.

**Value**
The comparison value provided by the user. Examples: `"Laptop"`, `100`, `"Electronics"`.

**Group**
A logical container for combining multiple conditions with AND or OR operators. Used internally to represent complex query logic.

**Filter Node**
An individual filter condition (a property, operator, and value). Filters are the leaf nodes in the filter tree.

**Group Node**
A node that contains multiple child nodes (filters or other groups) combined with an AND or OR operator.

**Raw Filter**
The string representation of a filter expression. This is what gets serialized and can be passed between components or stored in URLs.

**Predicate**
A JavaScript function that tests whether an item matches the filter criteria. Returns `true` if the item should be included, `false` otherwise.

## Core Concepts & Usage

### Understanding the Schema

The schema is the most important part of Query Builder. It defines what users can filter and how. Here's a detailed example:

```typescript
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'

interface Article {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  views: number
}

const schema = useQueryBuilderSchema<Article>({
  // The empty string key defines the "any property" fallback
  '': {
    label: 'Any property',
    operators: {
      contains: { label: 'Contains' },
    },
  },

  // Text properties with multiple operators
  title: {
    label: 'Article Title',
    operators: {
      contains: { label: 'Contains' },
      startsWith: { label: 'Starts with' },
      endsWith: { label: 'Ends with' },
      matchesRegex: { label: 'Matches regex' },
    },
  },

  // Enum-like property with predefined values
  status: {
    label: 'Status',
    operators: {
      is: {
        label: 'Is',
        values: {
          draft: 'Draft',
          published: 'Published',
          archived: 'Archived',
        },
      },
      isNot: {
        label: 'Is not',
        values: {
          draft: 'Draft',
          published: 'Published',
          archived: 'Archived',
        },
      },
    },
  },

  // Numeric property with comparison operators
  views: {
    label: 'Number of Views',
    operators: {
      greaterThan: { label: '>' },
      greaterThanOrEqual: { label: '>=' },
      lessThan: { label: '<' },
      lessThanOrEqual: { label: '<=' },
    },
  },
})
```

### useQueryBuilderFilter: Filtering Data

The `useQueryBuilderFilter` composable handles filtering and URL persistence:

```typescript
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter'

const items = ref<User[]>([...])
const schema = useQueryBuilderSchema<User>({...})

// The composable automatically:
// - Persists the filter in the URL (e.g., ?qb.users=name:John)
// - Filters your items in real-time
// - Handles invalid filter expressions gracefully
const { items: filteredItems, filter } = useQueryBuilderFilter(
  'users',           // Unique ID (used in URL)
  () => items.value, // Your data source
  {
    initialFilter: 'name:John'  // Optional: pre-set filter
  }
)

// Use filteredItems in your template or computed properties
console.log(filteredItems.value)  // Reactive array of filtered items

// Access the filter string
console.log(filter.value)  // Current filter expression
```

### useQueryBuilder: Advanced Query Building

For building interactive query builder UIs, use `useQueryBuilder`:

```typescript
import { useQueryBuilder } from '@core/packages/query-builder/use-query-builder'

const filterString = ref('status:published')
const schema = useQueryBuilderSchema<Article>({...})

const { rootGroup, isUsable, updateFilter, resetFilter } = useQueryBuilder(filterString, schema)

// rootGroup is a reactive tree structure you can traverse and modify
// It represents the parsed query

// If the filter string is invalid, isUsable will be false
if (!isUsable.value) {
  console.log('Current filter is not valid')
  resetFilter()  // Reset to an empty query
}

// After modifying the tree, sync back to the filter string
updateFilter()  // Updates filterString.value from rootGroup

// You can also directly modify the tree structure:
rootGroup.value.addChildFilter()  // Add a new filter condition
rootGroup.value.operator.value = 'or'  // Change AND to OR
```

### Building Schemas with Utilities

Instead of manually defining operators for every property, you can use the provided schema builder utilities. These helpers eliminate repetition and ensure consistent operator sets:

```typescript
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema'

interface Product {
  name: string
  description: string
  category: 'electronics' | 'furniture' | 'clothing'
  price: number
  inStock: boolean
}

const schema = useQueryBuilderSchema<Product>({
  // Catch-all search
  '': useStringSchema('Any property'),

  // String properties - full operators (contains, startsWith, regex, etc.)
  name: useStringSchema('Product Name'),
  description: useStringSchema('Description'),

  // String with predefined values - only exact match operators
  category: useStringSchema('Category', {
    electronics: 'Electronics',
    furniture: 'Furniture',
    clothing: 'Clothing',
  }),

  // Numeric properties - comparison operators
  price: useNumberSchema('Price', {
    '100': '$100',
    '500': '$500',
    '1000': '$1000',
  }),

  // Boolean properties
  inStock: useBooleanSchema('In Stock'),
})
```

The utilities create appropriate operator sets:

- **`useStringSchema(label, values?)`**: Creates string operators (contains, startsWith, endsWith, regex, glob, etc.). With predefined `values`, it limits to exact match operators (is, isNot).
- **`useNumberSchema(label, values?)`**: Creates numeric comparison operators (>, <, >=, <=, =, !=).
- **`useBooleanSchema(label)`**: Creates boolean operators (isEmpty, isNotEmpty).

### Supported Operators

Query Builder supports these operators out of the box:

| Operator             | Description                       | Expects Value | Example                 |
| -------------------- | --------------------------------- | ------------- | ----------------------- |
| `contains`           | Text contains substring           | Yes           | `name:john` or `Laptop` |
| `doesNotContain`     | Text doesn't contain substring    | Yes           | `!name:admin`           |
| `is`                 | Exact match (case-sensitive)      | Yes           | `status:active`         |
| `isNot`              | Exact match doesn't apply         | Yes           | `!status:inactive`      |
| `startsWith`         | Text starts with substring        | Yes           | `email:/^test/i`        |
| `doesNotStartWith`   | Text doesn't start with substring | Yes           | `!email:/^admin/i`      |
| `endsWith`           | Text ends with substring          | Yes           | `domain:/.com$/`        |
| `doesNotEndWith`     | Text doesn't end with substring   | Yes           | `!(domain:/.local$/)`   |
| `matchesRegex`       | Matches regex pattern             | Yes           | `code:/^[A-Z]{3}/`      |
| `doesNotMatchRegex`  | Doesn't match regex pattern       | Yes           | `!(code:/^TEMP/)`       |
| `matchesGlob`        | Matches glob pattern              | Yes           | `filename:*.txt`        |
| `doesNotMatchGlob`   | Doesn't match glob pattern        | Yes           | `!(filename:*.log)`     |
| `greaterThan`        | Numeric comparison >              | Yes           | `price:>100`            |
| `greaterThanOrEqual` | Numeric comparison >=             | Yes           | `price:>=100`           |
| `lessThan`           | Numeric comparison <              | Yes           | `price:<100`            |
| `lessThanOrEqual`    | Numeric comparison <=             | Yes           | `price:<=100`           |
| `isEmpty`            | Value is empty/null               | No            | `description?`          |
| `isNotEmpty`         | Value is not empty/null           | No            | `!description?`         |

## Vue Components

Query Builder includes a set of Vue components to help you build interactive filter interfaces without writing complex UI logic from scratch.

### Main Component: VtsQueryBuilder

The `VtsQueryBuilder` component is the primary component you'll use. It provides:

- A text input field for entering filter expressions directly
- A visual query builder button that opens an interactive modal
- Real-time validation and visual feedback
- Responsive design (adapts to mobile and desktop)

**Usage:**

```vue
<template>
  <VtsQueryBuilder v-model="filter" :schema />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema'

const filter = ref('')

const schema = useQueryBuilderSchema({
  '': useStringSchema('Any property'),
  name: useStringSchema('Name'),
  status: useStringSchema('Status', { active: 'Active', inactive: 'Inactive' }),
})
</script>
```

The component handles the complete filtering workflow:

1. Users type filter expressions directly in the input field
2. Or click the builder button to construct queries visually with dropdowns and inputs
3. The `v-model` binding keeps the filter string synchronized

### Building Blocks

The `VtsQueryBuilder` component is built from smaller, composable components:

- `VtsQueryBuilderButton`: Opens the modal interface
- `VtsQueryBuilderModal`: The interactive query builder UI
- `VtsQueryBuilderFilter`: Renders individual filter conditions
- `VtsQueryBuilderGroup`: Container for grouped conditions with AND/OR logic
- `VtsQueryBuilderRow`: Wrapper for filter rows with controls

You can use these components directly if you need a fully custom UI, but `VtsQueryBuilder` covers most use cases.

## Best Practices

### 1. Define Schemas Clearly

Always define schemas that match your data structure exactly. Use descriptive labels:

```typescript
// Good: Clear labels that users understand
const schema = useQueryBuilderSchema<User>({
  email: {
    label: 'Email Address', // User-friendly
    operators: { contains: { label: 'Contains' } },
  },
})

// Avoid: Unclear or technical labels
const schema = useQueryBuilderSchema<User>({
  email: {
    label: 'email', // Not user-friendly
    operators: { contains: { label: 'cont' } }, // Abbreviations confuse users
  },
})
```

### 2. Provide Enum Values When Appropriate

For properties with limited options, always provide predefined values. This prevents errors and improves UX:

```typescript
// Good: Users select from a dropdown
const schema = useQueryBuilderSchema<Order>({
  status: {
    label: 'Order Status',
    operators: {
      is: {
        label: 'Is',
        values: {
          pending: 'Pending',
          shipped: 'Shipped',
          delivered: 'Delivered',
          cancelled: 'Cancelled',
        },
      },
    },
  },
})

// Avoid: Users must type exact values (error-prone)
const schema = useQueryBuilderSchema<Order>({
  status: {
    label: 'Order Status',
    operators: {
      is: { label: 'Is' }, // No predefined values = bad UX
    },
  },
})
```

### 3. Include a Catch-All Property

Always include an empty string key (`''`) in your schema as a fallback for "search any property":

```typescript
const schema = useQueryBuilderSchema<User>({
  '': {
    label: 'Any property',
    operators: {
      contains: { label: 'Contains' },
    },
  },
  // ... other properties
})
```

### 4. Keep Operators Minimal

Avoid offering operators that users won't need. Simpler schemas are easier to use:

```typescript
// Good: Only relevant operators
const schema = useQueryBuilderSchema<User>({
  age: {
    label: 'Age',
    operators: {
      greaterThan: { label: '>' },
      lessThan: { label: '<' },
    },
  },
})

// Avoid: Offering all operators for every property
const schema = useQueryBuilderSchema<User>({
  age: {
    label: 'Age',
    operators: {
      contains: { label: 'Contains' }, // Doesn't make sense for numbers
      matchesRegex: { label: 'Regex' }, // Confusing for numbers
      greaterThan: { label: '>' },
      // ... 15 more operators
    },
  },
})
```

### 5. Handle Invalid Filters Gracefully

Always check `isUsable` before relying on the parsed query:

```typescript
const { rootGroup, isUsable, resetFilter } = useQueryBuilder(filterString, schema)

// In your UI:
if (!isUsable.value) {
  // Show error or reset
  console.warn('Filter syntax is invalid')
  resetFilter()
}
```

## Advanced Patterns

### Working with Nested Properties

Query Builder supports filtering on nested object properties using colon notation:

```typescript
interface Company {
  id: string
  name: string
  address: {
    city: string
    country: string
  }
  employees: Array<{
    name: string
    department: string
  }>
}

const schema = useQueryBuilderSchema<Company>({
  '': {
    label: 'Any property',
    operators: { contains: { label: 'Contains' } },
  },
  name: {
    label: 'Company Name',
    operators: { contains: { label: 'Contains' } },
  },
  // Access nested properties using colon notation
  'address:city': {
    label: 'City',
    operators: { is: { label: 'Is' } },
  },
  'address:country': {
    label: 'Country',
    operators: { is: { label: 'Is' } },
  },
  'employees:name': {
    label: 'Employee Name',
    operators: { contains: { label: 'Contains' } },
  },
  'employees:department': {
    label: 'Department',
    operators: { contains: { label: 'Contains' } },
  },
})

// Users can now write queries like:
// 'address:city:"New York" employees:department:Engineering'
```

### Complex Logical Queries

Query Builder automatically handles complex AND/OR combinations:

```typescript
const filterString = ref('')

const { rootGroup, updateFilter } = useQueryBuilder(filterString, schema)

// Build programmatically
rootGroup.value.addChildFilter() // Add first filter
rootGroup.value.children[0].property.value = 'status'
rootGroup.value.children[0].operator.value = 'is'
rootGroup.value.children[0].value.value = 'active'

rootGroup.value.addChildGroup() // Add a group
rootGroup.value.children[1].operator.value = 'or'
rootGroup.value.children[1].addChildFilter()
rootGroup.value.children[1].children[0].property.value = 'archived'
rootGroup.value.children[1].children[0].operator.value = 'isNotEmpty'

updateFilter() // Sync to filter string

// This example builds: status:active (archived?)
// Which expands to: "status is active" AND ("archived is not empty")
```

### Duplicating and Managing Filter Conditions

Interactive query builders often need to duplicate or remove filters:

```typescript
const { rootGroup } = useQueryBuilder(filterString, schema)

// Duplicate a child (useful for "add another condition like this")
rootGroup.value.duplicateChild(0)

// Remove a child
rootGroup.value.removeChild(1)

// Remove a child but keep its children (flatten)
rootGroup.value.removeChild(2, true)

// Convert a filter to a group (add sub-conditions)
rootGroup.value.convertChildToGroup(0)

// Wrap all current conditions in a group (useful for OR queries)
rootGroup.value.wrapInGroup()
```

### Combining Multiple Filtered Lists

You can use multiple filter instances for different data sources in the same component:

```typescript
const users = ref<User[]>([...])
const posts = ref<Post[]>([...])

const userSchema = useQueryBuilderSchema<User>({...})
const postSchema = useQueryBuilderSchema<Post>({...})

const { items: filteredUsers, filter: userFilter } = useQueryBuilderFilter(
  'users',
  () => users.value
)

const { items: filteredPosts, filter: postFilter } = useQueryBuilderFilter(
  'posts',
  () => posts.value
)

// Each filter is independent and synced to different URL params
// URL: ?qb.users=...&qb.posts=...
```

### Building a Custom Query Builder UI

If you need full control over the UI, work directly with the root group structure:

```vue
// In your component:
<template>
  <div v-if="!isUsable" class="error">Invalid filter</div>

  <div v-else class="query-builder">
    <div class="group-controls">
      <button @click="rootGroup.addChildFilter">+ Condition</button>
      <button @click="rootGroup.addChildGroup">+ Group</button>
      <select v-model="rootGroup.operator">
        <option value="and">AND</option>
        <option value="or">OR</option>
      </select>
    </div>

    <div class="children-list">
      <div v-for="(child, index) in rootGroup.children" :key="child.id">
        <FilterRow v-if="!child.isGroup" :filter="child" @remove="rootGroup.removeChild(index)" />
        <GroupRow v-else :group="child" @remove="rootGroup.removeChild(index)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const filterString = ref('')
const { rootGroup, isUsable, updateFilter } = useQueryBuilder(filterString, schema)

// Update the filter string when the tree changes
watch(
  () => rootGroup.value.rawFilter,
  () => updateFilter(),
  { deep: true }
)
</script>
```

### Text Search Every Property

For a simple "search everywhere" feature:

```typescript
const searchQuery = ref('')

const { items: searchResults } = useQueryBuilderFilter('search', () => items.value, {
  initialFilter: computed(() => searchQuery.value),
})
```

This leverages the catch-all `''` property defined in the schema to search all properties at once.

### Filtering Non-Existent Properties

When users write filter expressions that reference properties not defined in the schema, Query Builder gracefully handles this by falling back to the "any property" (`''`) filter. This allows for flexible search experiences where exact property names don't need to be known in advance.

For example, if a schema doesn't define a `custom_field` property but a user types `custom_field:value`, the query parser will fall back to the catch-all property. The result will be no matches (since the property doesn't exist on your objects), which is the expected behavior.
