import { parse, toString } from './'
import { ast, pattern } from './index.fixtures'

export default ({ benchmark }) => {
  benchmark('parse', () => {
    parse(pattern)
  })

  benchmark('toString', () => {
    ;ast::toString()
  })
}
