import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export type DockerContainerActionError = {
  containerName: string
  action: string
  message: string
}

/**
 * The last failed container action, shown above the containers table whether
 * it was run from the table or from the side panel
 */
export const useDockerContainerActionError = createGlobalState(() => {
  const dockerContainerActionError = ref<DockerContainerActionError>()

  function clearDockerContainerActionError() {
    dockerContainerActionError.value = undefined
  }

  return { dockerContainerActionError, clearDockerContainerActionError }
})
