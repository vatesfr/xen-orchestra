import { useVdfAvailability } from '@/modules/vdf/composables/vdf-availability.composable.ts'
import { useVdfPublishedPolicy } from '@/modules/vdf/remote-resources/use-vdf-published-policy.ts'
import { isVdfTag } from '@/modules/vdf/utils/vdf-group-tags.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

// XO reserves the `vdf:` tags to administrators (and to those with the
// administrate permission on the pool): the pool's policy answer says whether
// the current user is one. Without it (plugin not loaded, answer pending), the
// tags are offered and the server's refusal is shown.
export function useVmReservedTags(vm: MaybeRefOrGetter<FrontXoVm>) {
  const { t } = useI18n()

  const { isVdfEnabled } = useVdfAvailability()

  const { publishedPolicy } = useVdfPublishedPolicy({ isEnabled: isVdfEnabled }, () => toValue(vm).$pool)

  const areVdfTagsLocked = computed(() => isVdfEnabled.value && publishedPolicy.value?.canEdit === false)

  function getTagLock(tag: string) {
    return areVdfTagsLocked.value && isVdfTag(tag) ? t('vm-tag:firewall-tag-reserved') : undefined
  }

  return { getTagLock }
}
