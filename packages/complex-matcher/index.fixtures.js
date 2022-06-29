'use strict'

const CM = require('./')

exports.pattern = 'foo !"\\\\ \\"" name:|(wonderwoman batman) hasCape? age:32 chi*go /^foo\\/bar\\./i'

exports.ast = new CM.And([
  new CM.String('foo'),
  new CM.Not(new CM.String('\\ "')),
  new CM.Property('name', new CM.Or([new CM.String('wonderwoman'), new CM.String('batman')])),
  new CM.TruthyProperty('hasCape'),
  new CM.Property('age', new CM.NumberOrStringNode('32')),
  new CM.GlobPattern('chi*go'),
  new CM.RegExp('^foo/bar\\.', 'i'),
])
