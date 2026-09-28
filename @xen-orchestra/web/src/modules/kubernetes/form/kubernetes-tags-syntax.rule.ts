import { isValidKubernetesTagsString } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'
import { createRule, type Maybe } from '@regle/core'

export const kubernetesTagsSyntax = createRule({
  validator(value: Maybe<string>) {
    if (value === undefined || value === null || value === '') {
      return true
    }

    return isValidKubernetesTagsString(value)
  },
  message: 'Invalid tag syntax',
})
