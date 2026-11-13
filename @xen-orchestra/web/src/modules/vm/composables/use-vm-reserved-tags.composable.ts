import { useVdfFirewallRights } from '@/modules/vdf/composables/vdf-rights.composable.ts'
import { isVdfTag } from '@/modules/vdf/utils/vdf-group-tags.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

// XO reserves the `vdf:` tags: each one takes a firewall right on the VM's
// pool, per tag and per direction (a group tag `membership`, adding
// vdf:quarantine `quarantine:add`, removing it `quarantine:remove`). While
// the rights aren't known (plugin not loaded, answer pending), the tags are
// offered and the server's refusal is shown.
export function useVmReservedTags(vm: MaybeRefOrGetter<FrontXoVm>) {
  const { t } = useI18n()

  const { missingForTag, rightLabel } = useVdfFirewallRights(() => toValue(vm).$pool)

  // why the tag can't be added to the VM (or removed from it), if it can't
  function getTagLock(tag: string, change: 'add' | 'remove' = toValue(vm).tags.includes(tag) ? 'remove' : 'add') {
    if (!isVdfTag(tag)) {
      return undefined
    }

    const missing = missingForTag(tag, change)

    return missing === undefined ? undefined : t(`vm-tag:firewall-tag-locked:${change}`, { right: rightLabel(missing) })
  }

  return { getTagLock }
}
