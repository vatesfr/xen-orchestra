import colors from 'colors/safe'
import LEVELS, { NAMES } from '../levels'

const debugConsole = message => console.log(colors.cyan(message))
const infoConsole = message => console.info(colors.green(message))
const warnConsole = message => console.warn(colors.yellow(message))
const errorConsole = message => console.error(colors.red(message))

const { ERROR, INFO, WARN } = LEVELS

const consoleColorTransport = ({ data, level, namespace, message, time }) => {
  const fn =
    level < INFO
      ? debugConsole
      : level < WARN
        ? infoConsole
        : level < ERROR
          ? warnConsole
          : errorConsole

  fn(`${time.toISOString()} - ${namespace} - [${NAMES[level]}] ${message}`)
  data != null && fn(data)
}
export default () => consoleColorTransport
