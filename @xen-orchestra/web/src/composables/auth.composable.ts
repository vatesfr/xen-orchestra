import { useCookies } from '@vueuse/integrations/useCookies'

export const useAuth = () => {
  const { get, remove } = useCookies()

  const logout = () => {
    if (get('token') === undefined) {
      return
    }

    remove('token')
  }

  return {
    logout,
  }
}
