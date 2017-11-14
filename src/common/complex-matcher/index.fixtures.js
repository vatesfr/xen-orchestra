import {
  createAnd,
  createOr,
  createNot,
  createProperty,
  createString,
  createTruthyProperty,
} from './'

export const pattern = 'foo !"\\\\ \\"" name:|(wonderwoman batman) hasCape?'

export const ast = createAnd([
  createString('foo'),
  createNot(createString('\\ "')),
  createProperty(
    'name',
    createOr([createString('wonderwoman'), createString('batman')])
  ),
  createTruthyProperty('hasCape'),
])
