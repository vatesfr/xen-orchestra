import { useJsonSchemaNestedLabel } from '@/modules/plugin/composables/use-json-schema-nested-label.composable.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function mountNestedLabel() {
  return mountComposable(() => ({ getNestedLabel: useJsonSchemaNestedLabel() })).wrapper.vm.getNestedLabel
}

it('keeps a single label as it is', () => {
  expect(mountNestedLabel()(['Server'])).toBe('Server')
})

it('nests each label in its parent', () => {
  expect(mountNestedLabel()(['Server', 'Credentials', 'Password'])).toBe(
    t('json-schema:nested-label', {
      parent: t('json-schema:nested-label', { parent: 'Server', label: 'Credentials' }),
      label: 'Password',
    })
  )
})
