import { useVdiPageContext } from '@/modules/vdi/composables/use-vdi-page-context.composable.ts'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

function readFlags(fromContext: VdiPageContext | undefined) {
  const { isFromVm, isFromSr, isFromSnapshot, isFromVdiSnapshot } = mountComposable(() =>
    useVdiPageContext(fromContext)
  ).wrapper.vm

  return { isFromVm, isFromSr, isFromSnapshot, isFromVdiSnapshot }
}

const NO_CONTEXT = { isFromVm: false, isFromSr: false, isFromSnapshot: false, isFromVdiSnapshot: false }

it.each([
  { fromContext: VDI_PAGE_CONTEXT.VM, flag: 'isFromVm' },
  { fromContext: VDI_PAGE_CONTEXT.SR, flag: 'isFromSr' },
  { fromContext: VDI_PAGE_CONTEXT.SNAPSHOT, flag: 'isFromSnapshot' },
  { fromContext: VDI_PAGE_CONTEXT.VDI_SNAPSHOT, flag: 'isFromVdiSnapshot' },
] as const)('only sets $flag when the page is opened from the $fromContext', ({ fromContext, flag }) => {
  expect(readFlags(fromContext)).toEqual({ ...NO_CONTEXT, [flag]: true })
})

it('sets no flag without a context', () => {
  expect(readFlags(undefined)).toEqual(NO_CONTEXT)
})

it('follows the context it is given', () => {
  const fromContext = ref<VdiPageContext>(VDI_PAGE_CONTEXT.VM)
  const { wrapper } = mountComposable(() => useVdiPageContext(fromContext))

  fromContext.value = VDI_PAGE_CONTEXT.SR

  expect(wrapper.vm.isFromVm).toBe(false)
  expect(wrapper.vm.isFromSr).toBe(true)
})
