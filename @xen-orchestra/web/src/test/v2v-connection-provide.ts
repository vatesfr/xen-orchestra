import {
  createV2vConnectionContext,
  IK_V2V_CONNECTION,
  type V2vConnectionContext,
} from '@/modules/v2v/composables/use-v2v-connection.composable.ts'

/**
 * The `provide` mounting option standing in for the V2V migration page, for a
 * wizard component or composable mounted on its own. Pass the context to
 * connect it or read it from the test.
 */
export function v2vConnectionProvide(context: V2vConnectionContext = createV2vConnectionContext()) {
  return { [IK_V2V_CONNECTION]: context }
}
