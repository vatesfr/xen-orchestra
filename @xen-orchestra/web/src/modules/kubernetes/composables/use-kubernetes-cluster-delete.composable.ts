import { useXoKubernetesClusterDeleteJob } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-delete.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isClusterDeletable } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
/* import { useRedirectAfterDelete } from '@/shared/composables/redirect-after-delete.composable.ts' */
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
/* import { useRoute } from 'vue-router' */

export function useKubernetesClusterDelete(rawClusters: MaybeRefOrGetter<XoKubernetesCluster[]>) {
  const clusters = toComputed(rawClusters)

  const { t } = useI18n()

  /* const route = useRoute() */

  const selectedClusterId = useRouteQuery('id')

  const { run, canRun, isRunning: isDeletingClusters } = useXoKubernetesClusterDeleteJob(clusters)

  const canDeleteClusters = computed(
    () => canRun.value && clusters.value.every(cluster => isClusterDeletable(cluster.phase))
  )

  /* const { redirectIfOnObjectPage } = useRedirectAfterDelete({
    isOnObjectPage: () => route.name === '/kubernetes/cluster/[id]',
    redirectTo: { name: '/kubernetes/clusters' },
  }) */

  const { open } = useDeleteModal()

  function deleteClusters() {
    const count = clusters.value.length
    const isSingleCluster = count === 1

    return open({
      events: {
        onConfirm: async () => {
          /* let result */

          try {
            /* result = await run() */
            await run()

            if (clusters.value.some(cluster => cluster.id === selectedClusterId.value)) {
              selectedClusterId.value = ''
            }
          } catch (error) {
            console.error('Error when deleting cluster:', error)
          }

          // TODO Uncomment (and all related lines) when the API result is usable
          /* await redirectIfOnObjectPage(result) */
        },
      },
      props: {
        subject: t('n-clusters', { n: count }),
        description: t('cluster-delete-warning', { n: count }),
        confirmLabel: isSingleCluster ? t('action:delete') : t('action:delete-n-clusters', { n: count }),
      },
    })
  }

  return { deleteClusters, canDeleteClusters, isDeletingClusters }
}
