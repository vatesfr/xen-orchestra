import { useXenApiStoreBaseContext } from "@/composables/xen-api-store-base-context.composable";
import { useXenApiStoreSubscriber } from "@/composables/xen-api-store-subscriber.composable";
import type {
  ObjectType,
  ObjectTypeToRecord,
} from "@/libs/xen-api/xen-api.types";

export const useXenApiStoreSubscribableContext = <
  Type extends ObjectType,
  XRecord extends ObjectTypeToRecord<Type>,
>(
  type: Type
) => {
  const baseContext = useXenApiStoreBaseContext<XRecord>();
  const subscriber = useXenApiStoreSubscriber(type, baseContext);
  return {
    ...baseContext,
    ...subscriber,
  };
};

export type XenApiStoreSubscribableContext<
  Type extends ObjectType,
  XRecord extends ObjectTypeToRecord<Type>,
> = ReturnType<typeof useXenApiStoreSubscribableContext<Type, XRecord>>;
