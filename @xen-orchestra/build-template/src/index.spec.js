/* eslint-env jest */
import buildTemplate from '.'

it('builds a template', () => {
  const replacer = buildTemplate(
    '{property}_\\{property}_\\\\{property}_{constant}_%_FOO',
    {
      '{property}': obj => obj.name,
      '{constant}': 1235,
      '%': (_, i) => i,
    }
  )
  expect(replacer({ name: 'toto' }, 5)).toBe(
    'toto_{property}_\\toto_1235_5_FOO'
  )
})
