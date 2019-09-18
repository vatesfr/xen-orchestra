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
  expect(replacer({ name: 'bar' }, 5)).toBe('bar_{property}_\\bar_1235_5_FOO')
})
