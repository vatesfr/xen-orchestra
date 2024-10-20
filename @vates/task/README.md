<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/task

[![Package Version](https://badgen.net/npm/v/@vates/task)](https://npmjs.org/package/@vates/task) ![License](https://badgen.net/npm/license/@vates/task) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/task)](https://bundlephobia.com/result?p=@vates/task) [![Node compatibility](https://badgen.net/npm/node/@vates/task)](https://npmjs.org/package/@vates/task)

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/task):

```sh
npm install --save @vates/task
```

## Usage

```js
import { Task } from '@vates/task'

const task = new Task({
  // this object will be sent in the *start* event
  properties: {
    name: 'my task',
  },

  // if defined, a new detached task is created
  //
  // if not defined and created inside an existing task, the new task is considered a subtask
  onProgress(event) {
    // this function is called each time this task or one of it's subtasks change state
    const { id, timestamp, type } = event
    if (type === 'start') {
      const { name, parentId, properties } = event
    } else if (type === 'end') {
      const { result, status } = event
    } else if (type === 'info' || type === 'warning') {
      const { data, message } = event
    } else if (type === 'property') {
      const { name, value } = event
    } else if (type === 'abortionRequested') {
      const { reason } = event
    }
  },
})

// this field is settable once before being observed
task.id

// contains the current status of the task
//
// possible statuses are:
// - pending
// - success
// - failure
task.status

// Triggers the abort signal associated to the task.
//
// This simply requests the task to abort, it will be up to the task to handle or not this signal.
task.abort(reason)

// if fn rejects, the task will be marked as failed
const result = await task.runInside(fn)

// if fn rejects, the task will be marked as failed
// if fn resolves, the task will be marked as succeeded
const result = await task.run(fn)

// manually starts the task
task.start()

// manually finishes the task in success state
task.success(result)

// manually finishes the task in failure state
task.failure(error)
```

Inside a task:

```js
// the abort signal of the current task if any, otherwise is `undefined`
Task.abortSignal

// sends an info on the current task if any, otherwise does nothing
Task.info(message, data)

// sends an info on the current task if any, otherwise does nothing
Task.warning(message, data)

// attaches a property to the current task if any, otherwise does nothing
//
// the latest value takes precedence
//
// examples:
// - progress
Task.set(property, value)
```

### `Task.run([opts], fn, ...args)`

This is a convenient shortcut to `new Task(opts).run(() => fn(...args))`.

```js
// options can be passed
await Task.run({ properties: { name: 'foo' } }, fn)

// arguments can be passed
await Task.run(fn, 'foo', 'bar')

// context (this) is forwarded
await Task.run.call(object, object.method)

// as a convenience, you can pass a method name directly
await Task.run.call(object, 'method')

// everything together
await Task.run.call(object, 'method', 'foo', 'bar')
```

### `combineEvents`

Create a consolidated log from individual events.

It can be used directly as an `onProgress` callback:

```js
import { makeOnProgress } from '@vates/task/combineEvents'

const onProgress = makeOnProgress({
  // This function is called each time a root task starts.
  //
  // It will be called for as many times as there are tasks created with this `onProgress` function.
  onRootTaskStart(taskLog) {
    // `taskLog` is an object reflecting the state of this task and all its subtasks,
    // and will be mutated in real-time to reflect the changes of the task.

    // timestamp at which the task started
    taskLog.start

    // current status of the task as described in the previous section
    taskLog.status

    // undefined or a dictionary of properties attached to the task
    taskLog.properties

    // timestamp at which the abortion was requested, undefined otherwise
    taskLog.abortionRequestedAt

    // undefined or an array of infos emitted on the task
    taskLog.infos

    // undefined or an array of warnings emitted on the task
    taskLog.warnings

    // timestamp at which the task ended, undefined otherwise
    taskLog.end

    // undefined or the result value of the task
    taskLog.result
  },

  // This function is called each time a root task ends.
  onRootTaskEnd(taskLog) {},

  // This function is called each time a root task or a subtask is updated.
  //
  // `taskLog.$root` can be used to uncondionally access the root task.
  onTaskUpdate(taskLog) {},
})

Task.run({ properties: { name: 'my task' }, onProgress }, asyncFn)
```

It can also be fed event logs directly:

```js
import { makeOnProgress } from '@vates/task/combineEvents'

const onProgress = makeOnProgress({ onRootTaskStart, onRootTaskEnd, onTaskUpdate })

eventLogs.forEach(onProgress)
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
