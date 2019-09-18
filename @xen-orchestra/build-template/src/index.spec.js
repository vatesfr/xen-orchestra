/* eslint-env jest */
import buildTemplate from '.'

it('builds a template', () => {
  const replacer = buildTemplate('{name}_\\{name}_\\\\{name}_{id}_%_FOO', {
    '{name}': obj => obj.name,
    '{id}': 1235,
    '%': (_, i) => i,
  })
  expect(replacer({ name: 'toto' }, 5)).toBe('toto_{name}_\\toto_1235_5_FOO')
})
