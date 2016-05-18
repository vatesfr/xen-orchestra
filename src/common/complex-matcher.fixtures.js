import invoke from './invoke'

export const pattern = 'foo !"\\\\ \\"" name:|(wonderwoman batman)'

export const ast = invoke(() => {
  const and = (...children) => ({ type: 'and', children })
  const or = (...children) => ({ type: 'or', children })
  const not = child => ({ type: 'not', child })
  const property = (name, child) => ({ type: 'property', name, child })
  const string = value => ({ type: 'string', value })

  return and(
    string('foo'),
    not(string('\\ "')),
    property('name', or(
      string('wonderwoman'),
      string('batman')
    ))
  )
})
