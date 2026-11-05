import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { JsonSchemaSelectOption, XoObjectType } from '@/modules/plugin/utils/json-schema.util.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, type Ref } from 'vue'

type XoObject = { id: string; name_label: string; tags: string[] }

type CollectionType = Exclude<XoObjectType, 'tag'>

type Collection = { objects: Ref<XoObject[]>; isReady: Ref<boolean>; hasError: Ref<boolean> }

function toOptions(objects: XoObject[]): JsonSchemaSelectOption[] {
  return objects.map(object => ({ value: object.id, label: object.name_label }))
}

function toTagOptions(objects: XoObject[]): JsonSchemaSelectOption[] {
  const tags = new Set(objects.flatMap(object => object.tags))

  return Array.from(tags)
    .sort((tag1, tag2) => tag1.localeCompare(tag2))
    .map(tag => ({ value: tag, label: tag }))
}

export function useXoObjectOptions(rawType: MaybeRefOrGetter<XoObjectType | undefined>) {
  const type = toComputed(rawType)

  function isCollectionNeeded(objectType: CollectionType) {
    return computed(() => type.value === objectType || type.value === 'tag')
  }

  const { hosts, areHostsReady, hasHostFetchError } = useXoHostCollection({ isEnabled: isCollectionNeeded('host') })
  const { pools, arePoolsReady, hasPoolFetchError } = useXoPoolCollection({ isEnabled: isCollectionNeeded('pool') })
  const { srs, areSrsReady, hasSrFetchError } = useXoSrCollection({ isEnabled: isCollectionNeeded('sr') })
  const { vms, areVmsReady, hasVmFetchError } = useXoVmCollection({ isEnabled: isCollectionNeeded('vm') })

  const collections: Record<CollectionType, Collection> = {
    host: { objects: hosts, isReady: areHostsReady, hasError: hasHostFetchError },
    pool: { objects: pools, isReady: arePoolsReady, hasError: hasPoolFetchError },
    sr: { objects: srs, isReady: areSrsReady, hasError: hasSrFetchError },
    vm: { objects: vms, isReady: areVmsReady, hasError: hasVmFetchError },
  }

  const neededCollections = computed(() => {
    if (type.value === undefined) {
      return []
    }

    return type.value === 'tag' ? Object.values(collections) : [collections[type.value]]
  })

  const options = computed<JsonSchemaSelectOption[]>(() => {
    const objects = neededCollections.value.flatMap(collection => collection.objects.value)

    return type.value === 'tag' ? toTagOptions(objects) : toOptions(objects)
  })

  const isReady = computed(() => neededCollections.value.every(collection => collection.isReady.value))

  const hasError = computed(() => neededCollections.value.some(collection => collection.hasError.value))

  return { options, isReady, hasError }
}
