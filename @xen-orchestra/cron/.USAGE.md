### Pattern syntax

```
<minute> <hour> <day of month> <month> <day of week>
```

Each entry can be:

- a single value
- a range (`0-23` or `*/2`)
- a list of values/ranges (`1,8-12`)

A wildcard (`*`) can be used as a shortcut for the whole range
(`first-last`).

Step values can be used in conjunctions with ranges. For instance,
`1-7/2` is the same as `1,3,5,7`.

| Field            | Allowed values                                                     |
| ---------------- | ------------------------------------------------------------------ |
| minute           | 0-59                                                               |
| hour             | 0-23                                                               |
| day of the month | 1-31 or 3-letter names (`jan`, `feb`, …)                           |
| month            | 0-11                                                               |
| day of week      | 0-7 (0 and 7 both mean Sunday) or 3-letter names (`mon`, `tue`, …) |

> Note: the month range is 0-11 to be compatible with
> [cron](https://github.com/kelektiv/node-cron), it does not appear to
> be very standard though.

### API

`createSchedule(pattern: string, zone: string = 'utc'): Schedule`

> Create a new schedule.

- `pattern`: the pattern to use, see [the syntax](#pattern-syntax)
- `zone`: the timezone to use, use `'local'` for the local timezone

```js
import { createSchedule } from '@xen-orchestra/cron'

const schedule = createSchedule('0 0 * * sun', 'America/New_York')
```

`Schedule#createJob(fn: Function): Job`

> Create a new job from this schedule.

- `fn`: function to execute, if it returns a promise, it will be
  awaited before scheduling the next run.

```js
const job = schedule.createJob(() => {
  console.log(new Date())
})
```

`Schedule#next(n: number): Array<Date>`

> Returns the next dates matching this schedule.

- `n`: number of dates to return

```js
schedule.next(2)
// [ 2018-02-11T05:00:00.000Z, 2018-02-18T05:00:00.000Z ]
```

`Schedule#startJob(fn: Function): () => void`

> Start a new job from this schedule and return a function to stop it.

- `fn`: function to execute, if it returns a promise, it will be
  awaited before scheduling the next run.

```js
const stopJob = schedule.startJob(() => {
  console.log(new Date())
})
stopJob()
```

`Job#start(): void`

> Start this job.

```js
job.start()
```

`Job#stop(): void`

> Stop this job.

```js
job.stop()
```
