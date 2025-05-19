# Job System Documentation

The Job System provides a type-safe way to manage asynchronous operations with built-in state handling and identity-based concurrency control.

## Core Concepts

- **Job**: An asynchronous operation with validation, state management, and concurrency control
- **Job Arguments**: Typed parameters that can be single values or arrays
- **Job Identity**: Values used to track concurrent executions of the same job

## Usage

### When to use argument identity?

You'll want to use a Job argument as identity when two different values means two different processes.

Let's imagine a job to save a document, which will take `id` and `content` as arguments.

Should the job be tracked by the document ID? Yes, because `isRunning` could be `true` for file A and `false` for file B.

Should the job be tracked by the document content? No, because `isRunning` should stay `true` for a specific file, even if the `content` value changes.

### Defining Job Arguments

```typescript
const userIdArg = defineJobArg<string>({
  identify: true, // Automatically use value as identity for primitive types
})

const itemsArg = defineJobArg<Item>({
  identify: item => item.id, // `Item` not being a primitive, we need to use a function to get its identity
  toArray: true, // this argument will always be converted to an array if needed
})

const forceArg = defineJobArg<boolean>({
  identify: false, // Don't track this argument for concurrency. Whether it to be true or false shouldn't affect the running state of the job
})
```

### Defining a Job

```typescript
const myJob = defineJob('processItems', [userIdArg, itemsArg, optionsArg], () => ({
  validate(isRunning, userId, items) {
    // You can use custom running check additional to internal one
    if (isRunning || isProcessingItems(userId, items)) {
      throw new JobRunningError('Items are being processed')
    }

    if (items.length === 0) {
      throw new JobError('No item to process')
    }

    if (!userId) {
      throw new JobError('User ID required')
    }
  },
  run(userId, items, force) {
    // Job implementation
    return processItems(userId, items, force)
  },
}))
```

## Type System

### Argument Types

When defining a job argument with `defineJobArg<string>({ toArray?: false })`, then:

- the `defineJob`'s `run` handler will receive a `string`
- the `defineJob`'s `validate` handler will receive a `string | undefined`
- the generated `useJob` will receive a `MaybeRefOrGetter<string | undefined>`

When defining a job argument with `defineJobArg<string>({ toArray: true })`, then:

- the `defineJob`'s `run` handler will receive a `string[]`
- the `defineJob`'s `validate` handler will receive a `string[] | undefined`
- the generated `useJob` will receive a `MaybeRefOrGetter<MaybeArray<string | undefined>>`

### Using a Job

```typescript
// Define reactive arguments
const userId = ref()

const selectedItems = computed(() => props.selectedItems)

// Create job instance with destructured properties
const {
  run, // Execute the handler
  canRun, // A `boolean` computed
  errorMessage, // A `string | undefined` computed
  isRunning, // A `boolean` computed
} = useMyJob(userId, selectedItems, false)
```

When calling `run`, the job will be marked as "running" for the specified `userId` and `selectedItems` (`force` is ignored because it has been configured with `identify: false`)

When using an array, the tracking is done for each item individually.

Let's take a simplified example for a 5-second handling process:

```typescript
const userId = ref(1)

const selectedItems = ref([{ id: 'A' }, { id: 'B' }])

const { run, isRunning } = useMyJob(userId, selectedItems)

run()

// isRunning = true

userId.value = 2

// isRunning = false

userId.value = 1

// isRunning = true

selectedItems.value = [{ id: 'A' }, { id: 'C' }]

// isRunning = true

selectedItems.value = [{ id: 'C' }]

// isRunning = false
```
