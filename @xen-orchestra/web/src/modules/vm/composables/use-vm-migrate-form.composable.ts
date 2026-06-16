import { IK_VM_MIGRATE_FORM, type VmMigrateFormState } from '@/modules/vm/types/vm-migrate.type.ts'
import { inject } from 'vue'

export function useVmMigrateForm(): VmMigrateFormState {
  const form = inject(IK_VM_MIGRATE_FORM)

  if (form === undefined) {
    throw new Error('useVmMigrateForm must be used within a component rendered by VmMigrateDrawer')
  }

  return form
}
