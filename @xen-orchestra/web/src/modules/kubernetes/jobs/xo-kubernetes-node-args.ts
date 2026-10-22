import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { defineJobArg } from '@core/packages/job'

export const xoKubernetesNodeArg = defineJobArg({
  identify: (node: XoKubernetesNode) => node.id,
  toArray: false,
})
