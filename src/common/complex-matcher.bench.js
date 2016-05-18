import {
  parse,
  toString
} from './complex-matcher'
import {
  ast,
  pattern
} from './complex-matcher.fixtures'

export default ({ benchmark }) => {
  benchmark('parse', () => {
    parse(pattern)
  })

  benchmark('toString', () => {
    toString(ast)
  })
}
