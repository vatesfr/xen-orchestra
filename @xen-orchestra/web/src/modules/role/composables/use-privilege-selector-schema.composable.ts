import { useAclPrivilegeSelectorSchema } from '@/modules/role/composables/selector-schemas/use-acl-privilege-selector-schema.composable.ts'
import { useAclRoleSelectorSchema } from '@/modules/role/composables/selector-schemas/use-acl-role-selector-schema.composable.ts'
import { useAlarmSelectorSchema } from '@/modules/role/composables/selector-schemas/use-alarm-selector-schema.composable.ts'
import { useBackupArchiveSelectorSchema } from '@/modules/role/composables/selector-schemas/use-backup-archive-selector-schema.composable.ts'
import { useBackupJobSelectorSchema } from '@/modules/role/composables/selector-schemas/use-backup-job-selector-schema.composable.ts'
import { useBackupLogSelectorSchema } from '@/modules/role/composables/selector-schemas/use-backup-log-selector-schema.composable.ts'
import { useBackupRepositorySelectorSchema } from '@/modules/role/composables/selector-schemas/use-backup-repository-selector-schema.composable.ts'
import { useGroupSelectorSchema } from '@/modules/role/composables/selector-schemas/use-group-selector-schema.composable.ts'
import { useHostSelectorSchema } from '@/modules/role/composables/selector-schemas/use-host-selector-schema.composable.ts'
import { useMessageSelectorSchema } from '@/modules/role/composables/selector-schemas/use-message-selector-schema.composable.ts'
import { useNetworkSelectorSchema } from '@/modules/role/composables/selector-schemas/use-network-selector-schema.composable.ts'
import { usePbdSelectorSchema } from '@/modules/role/composables/selector-schemas/use-pbd-selector-schema.composable.ts'
import { usePciSelectorSchema } from '@/modules/role/composables/selector-schemas/use-pci-selector-schema.composable.ts'
import { usePgpuSelectorSchema } from '@/modules/role/composables/selector-schemas/use-pgpu-selector-schema.composable.ts'
import { usePifSelectorSchema } from '@/modules/role/composables/selector-schemas/use-pif-selector-schema.composable.ts'
import { usePoolSelectorSchema } from '@/modules/role/composables/selector-schemas/use-pool-selector-schema.composable.ts'
import { useProxySelectorSchema } from '@/modules/role/composables/selector-schemas/use-proxy-selector-schema.composable.ts'
import { useRestoreLogSelectorSchema } from '@/modules/role/composables/selector-schemas/use-restore-log-selector-schema.composable.ts'
import { useScheduleSelectorSchema } from '@/modules/role/composables/selector-schemas/use-schedule-selector-schema.composable.ts'
import { useServerSelectorSchema } from '@/modules/role/composables/selector-schemas/use-server-selector-schema.composable.ts'
import { useSmSelectorSchema } from '@/modules/role/composables/selector-schemas/use-sm-selector-schema.composable.ts'
import { useSrSelectorSchema } from '@/modules/role/composables/selector-schemas/use-sr-selector-schema.composable.ts'
import { useTaskSelectorSchema } from '@/modules/role/composables/selector-schemas/use-task-selector-schema.composable.ts'
import { useUserSelectorSchema } from '@/modules/role/composables/selector-schemas/use-user-selector-schema.composable.ts'
import { useVbdSelectorSchema } from '@/modules/role/composables/selector-schemas/use-vbd-selector-schema.composable.ts'
import { useVdiSelectorSchema } from '@/modules/role/composables/selector-schemas/use-vdi-selector-schema.composable.ts'
import { useVdiSnapshotSelectorSchema } from '@/modules/role/composables/selector-schemas/use-vdi-snapshot-selector-schema.composable.ts'
import { useVifSelectorSchema } from '@/modules/role/composables/selector-schemas/use-vif-selector-schema.composable.ts'
import { useVmControllerSelectorSchema } from '@/modules/role/composables/selector-schemas/use-vm-controller-selector-schema.composable.ts'
import { useVmSelectorSchema } from '@/modules/role/composables/selector-schemas/use-vm-selector-schema.composable.ts'
import { useVmSnapshotSelectorSchema } from '@/modules/role/composables/selector-schemas/use-vm-snapshot-selector-schema.composable.ts'
import { useVmTemplateSelectorSchema } from '@/modules/role/composables/selector-schemas/use-vm-template-selector-schema.composable.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// A selector is evaluated by the server against the raw XO object, so only the properties that
// object actually carries can be offered here — never the values the front computes for its own
// tables (IP addresses, disk space…), which would match nothing.
export function usePrivilegeSelectorSchema(resource: MaybeRefOrGetter<SelectablePrivilegeResource | undefined>) {
  const schemasByResource: Record<SelectablePrivilegeResource, QueryBuilderSchema> = {
    'acl-privilege': useAclPrivilegeSelectorSchema(),
    'acl-role': useAclRoleSelectorSchema(),
    alarm: useAlarmSelectorSchema(),
    'backup-archive': useBackupArchiveSelectorSchema(),
    'backup-job': useBackupJobSelectorSchema(),
    'backup-log': useBackupLogSelectorSchema(),
    'backup-repository': useBackupRepositorySelectorSchema(),
    group: useGroupSelectorSchema(),
    host: useHostSelectorSchema(),
    message: useMessageSelectorSchema(),
    network: useNetworkSelectorSchema(),
    pbd: usePbdSelectorSchema(),
    pci: usePciSelectorSchema(),
    pgpu: usePgpuSelectorSchema(),
    pif: usePifSelectorSchema(),
    pool: usePoolSelectorSchema(),
    proxy: useProxySelectorSchema(),
    'restore-log': useRestoreLogSelectorSchema(),
    schedule: useScheduleSelectorSchema(),
    server: useServerSelectorSchema(),
    sm: useSmSelectorSchema(),
    sr: useSrSelectorSchema(),
    task: useTaskSelectorSchema(),
    user: useUserSelectorSchema(),
    vbd: useVbdSelectorSchema(),
    vdi: useVdiSelectorSchema(),
    'vdi-snapshot': useVdiSnapshotSelectorSchema(),
    vif: useVifSelectorSchema(),
    vm: useVmSelectorSchema(),
    'vm-controller': useVmControllerSelectorSchema(),
    'vm-snapshot': useVmSnapshotSelectorSchema(),
    'vm-template': useVmTemplateSelectorSchema(),
  }

  return computed<QueryBuilderSchema>(() => {
    const currentResource = toValue(resource)

    if (currentResource === undefined) {
      return {}
    }

    return schemasByResource[currentResource]
  })
}
