import LEVELS, { NAMES } from '../levels'

// Bind console methods (necessary for browsers)
const debugConsole = console.log.bind(console)
const infoConsole = console.info.bind(console)
const warnConsole = console.warn.bind(console)
const errorConsole = console.error.bind(console)

const { ERROR, INFO, WARN } = LEVELS

const consoleTransport = ({ data, level, namespace, message, time }) => {
  const fn =
    level < INFO
      ? debugConsole
      : level < WARN ? infoConsole : level < ERROR ? warnConsole : errorConsole

  fn('%s - %s - [%s] %s', time.toISOString(), namespace, NAMES[level], message)
  data != null && fn(data)
}
export default () => consoleTransport
