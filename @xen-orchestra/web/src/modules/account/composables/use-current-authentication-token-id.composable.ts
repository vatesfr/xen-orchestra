import { useCookies } from '@vueuse/integrations/useCookies'
import { computed } from 'vue'

export function useCurrentAuthenticationTokenId() {
  const cookies = useCookies(['token'])

  return computed(() => cookies.get<string | undefined>('token'))
}
