import { useJsonSchemaItemLabel } from '@/modules/plugin/composables/use-json-schema-item-label.composable.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function mountItemLabel() {
  return mountComposable(() => ({ getItemLabel: useJsonSchemaItemLabel() })).wrapper.vm.getItemLabel
}

it('numbers an item from 1, after the title of the item schema', () => {
  expect(mountItemLabel()(0, { title: 'Domain' })).toBe(t('json-schema:numbered-item', { label: 'Domain', n: 1 }))
})

it('names an item without title as an item', () => {
  expect(mountItemLabel()(2, {})).toBe(t('json-schema:numbered-item', { label: t('item'), n: 3 }))
})
