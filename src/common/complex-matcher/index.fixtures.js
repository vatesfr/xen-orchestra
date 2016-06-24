import {
  createAnd,
  createOr,
  createNot,
  createProperty,
  createString
} from './'

export const pattern = 'foo !"\\\\ \\"" name:|(wonderwoman batman)'

export const ast = createAnd([
  createString('foo'),
  createNot(createString('\\ "')),
  createProperty('name', createOr([
    createString('wonderwoman'),
    createString('batman')
  ]))
])
