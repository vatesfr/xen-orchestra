import type { SubscriberDependencies } from '@/composables/subscriber.composable'
import { useXenApiStoreBaseContext } from '@/composables/xen-api-store-base-context.composable'
import { useXenApiStoreSubscriber } from '@/composables/xen-api-store-subscriber.composable'
import type { ObjectType, ObjectTypeToRecord } from '@/libs/xen-api/xen-api.types'

export const useXenApiStoreSubscribableContext = <Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(
  type: Type,
  dependencies?: SubscriberDependencies
) => {
  const baseContext = useXenApiStoreBaseContext<XRecord>()
  const subscriber = useXenApiStoreSubscriber(type, baseContext, dependencies)
  return {
    ...baseContext,
    ...subscriber,
  }
}
