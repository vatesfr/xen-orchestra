import LEVELS, { NAMES } from '../levels'

const { DEBUG, ERROR, FATAL, INFO, WARN } = LEVELS

let formatLevel, formatNamespace
if (process.stdout !== undefined && process.stdout.isTTY && process.stderr !== undefined && process.stderr.isTTY) {
  const ansi = (style, str) => `\x1b[${style}m${str}\x1b[0m`

  const LEVEL_STYLES = {
    [DEBUG]: '2',
    [ERROR]: '1;31',
    [FATAL]: '1;31',
    [INFO]: '1',
    [WARN]: '1;33',
  }
  formatLevel = level => {
    const style = LEVEL_STYLES[level]
    const name = NAMES[level]
    return style === undefined ? name : ansi(style, name)
  }

  const NAMESPACE_COLORS = [
    196,
    202,
    208,
    214,
    220,
    226,
    190,
    154,
    118,
    82,
    46,
    47,
    48,
    49,
    50,
    51,
    45,
    39,
    33,
    27,
    21,
    57,
    93,
    129,
    165,
    201,
    200,
    199,
    198,
    197,
  ]
  formatNamespace = namespace => {
    // https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
    let hash = 0
    for (let i = 0, n = namespace.length; i < n; ++i) {
      hash = ((hash << 5) - hash + namespace.charCodeAt(i)) | 0
    }
    // // select a hue (HSV)
    // const h = (Math.abs(hash) % 20) * 18
    // // convert to RGB
    // const f = (n, k = (n + h / 60) % 6) =>
    //   Math.round(255 * (1 - Math.max(Math.min(k, 4 - k, 1), 0)))
    // const r = f(5)
    // const g = f(3)
    // const b = f(1)
    // return ansi(`38;2;${r};${g};${b}`, namespace)
    return ansi(`1;38;5;${NAMESPACE_COLORS[Math.abs(hash) % NAMESPACE_COLORS.length]}`, namespace)
  }
} else {
  formatLevel = str => NAMES[str]
  formatNamespace = str => str
}

const consoleTransport = ({ data, level, namespace, message, time }) => {
  const fn =
    /* eslint-disable no-console */
    level < INFO ? console.log : level < WARN ? console.info : level < ERROR ? console.warn : console.error
  /* eslint-enable no-console */

  const args = [time.toISOString(), formatNamespace(namespace), formatLevel(level), message]
  if (data != null) {
    args.push(data)
  }
  fn.apply(console, args)
}
export default () => consoleTransport
