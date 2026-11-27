import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isWritableSrOfPool } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useRestoreVmBackupArchiveDestination(
  rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>,
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>
) {
  const { t } = useI18n()

  const backupArchive = toComputed(rawBackupArchive)

  const poolId = toComputed(rawPoolId)

  const { pools, getPoolById } = useXoPoolCollection()

  const { srs, getSrById } = useXoSrCollection()

  const { hostsByPool, getMasterHostByPoolId } = useXoHostCollection()

  const { getVmById } = useXoVmCollection()

  const { useGetBackupRepositoryById } = useXoBackupRepositoryCollection()

  const { useGetProxyById } = useXoProxyCollection()

  const vmName = computed(
    () => getVmById(backupArchive.value.vm.uuid as FrontXoVm['id'])?.name_label ?? backupArchive.value.vm.name_label
  )

  const backupRepository = useGetBackupRepositoryById(() => backupArchive.value.backupRepository)

  const proxy = useGetProxyById(() => backupRepository.value?.proxy)

  const compatiblePools = computed(() => pools.value)

  const selectedPool = computed(() => getPoolById(poolId.value))

  const poolStorageRepositories = computed(() => srs.value.filter(sr => isWritableSrOfPool(sr, poolId.value)))

  const poolHosts = computed(() => (poolId.value === undefined ? [] : (hostsByPool.value.get(poolId.value) ?? [])))

  const poolMasterHost = computed(() => (poolId.value === undefined ? undefined : getMasterHostByPoolId(poolId.value)))

  const poolDefaultStorageRepository = computed(() => {
    const defaultSrId = selectedPool.value?.default_SR

    return poolStorageRepositories.value.find(sr => sr.id === defaultSrId)
  })

  function getPoolDetails(pool: FrontXoPool) {
    return t('n-hosts', { n: hostsByPool.value.get(pool.id)?.length ?? 0 })
  }

  function getSrFreeSpace(sr: FrontXoSr) {
    return Math.max(sr.size - sr.physical_usage, 0)
  }

  function getSrDetails(sr: FrontXoSr) {
    return t('n-free', { size: formatSize(getSrFreeSpace(sr), 1) })
  }

  return {
    vmName,
    backupRepository,
    proxy,
    compatiblePools,
    selectedPool,
    poolStorageRepositories,
    poolHosts,
    poolMasterHost,
    poolDefaultStorageRepository,
    getSrById,
    getPoolDetails,
    getSrFreeSpace,
    getSrDetails,
  }
}
