import { useV2vLaunchForm } from '@/modules/v2v/form/use-v2v-launch-form.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

// The launch form of the review step, its bindings unwrapped as a component receives them
export function mountV2vLaunchForm() {
  return mountComposableWithI18n(() => useV2vLaunchForm())
}
