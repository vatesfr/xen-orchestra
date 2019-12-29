import LEVELS, { NAMES } from '../levels'

const { ERROR, INFO, WARN } = LEVELS

const consoleTransport = ({ data, level, namespace, message, time }) => {
  const fn =
    /* eslint-disable no-console */
    level < INFO
      ? console.log
      : level < WARN
      ? console.info
      : level < ERROR
      ? console.warn
      : console.error
  /* eslint-enable no-console */

  const args = [time.toISOString(), namespace, NAMES[level], message]
  if (data != null) {
    args.push(data)
  }
  fn.apply(console, args)
}
export default () => consoleTransport
