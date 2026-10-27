import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'

/**
 * `useWatchCollection` types its predicate against the XO records, which the Kubernetes records are not: the
 * predicate is left out since the Kubernetes collections do not filter their events
 */
export function useWatchKubernetesCollection(resource: 'kubernetes-cluster' | 'kubernetes-node') {
  return { ...useWatchCollection({ resource }), predicate: undefined }
}
