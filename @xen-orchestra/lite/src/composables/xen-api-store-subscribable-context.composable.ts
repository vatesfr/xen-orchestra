import type { SubscriberDependencies } from '@/composables/subscriber.composable.ts'
import { useXenApiStoreBaseContext } from '@/composables/xen-api-store-base-context.composable.ts'
import { useXenApiStoreSubscriber } from '@/composables/xen-api-store-subscriber.composable.ts'
import type { ObjectType, ObjectTypeToRecord } from '@/libs/xen-api/xen-api.types.ts'

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
