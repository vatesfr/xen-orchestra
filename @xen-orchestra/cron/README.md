# @xen-orchestra/cron [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

> Focused, well maintained, cron parser/scheduler

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/cron):

```
> npm install --save @xen-orchestra/cron
```

## Usage

```js
import { createSchedule } from '@xen-orchestra/cron'

const schedule = createSchedule('0 0 * * sun', 'America/New_York')

schedule.next(2)
// [ 2018-02-11T05:00:00.000Z, 2018-02-18T05:00:00.000Z ]

const job = schedule.createJob(() => {
  console.log(new Date())
})
job.start()
job.stop()

const stopJob = schedule.startJob(() => {
  console.log(new Date())
})
stopJob()
```

> If the scheduled job returns a promise, its resolution (or
> rejection) will be awaited before scheduling the next run.

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

| Field            | Allowed values |
|------------------|----------------|
| minute           | 0-59           |
| hour             | 0-23           |
| day of the month | 1-31 or 3-letter names (`jan`, `feb`, …) |
| month            | 0-11           |
| day of week      | 0-7 (0 and 7 both mean Sunday) or 3-letter names (`mon`, `tue`, …) |

> Note: the month range is 0-11 to be compatible with
> [cron](https://github.com/kelektiv/node-cron), it does not appear to
> be very standard though.

## Development

```
# Install dependencies
> yarn

# Run the tests
> yarn test

# Continuously compile
> yarn dev

# Continuously run the tests
> yarn dev-test

# Build for production (automatically called by npm install)
> yarn build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](https://vates.fr)
