import { useCookies } from '@vueuse/integrations/useCookies'

export const useAuth = () => {
  const { get, remove } = useCookies()

  const logout = () => {
    if (get('token') === undefined) {
      console.error('No "token" cookie found')

      return
    }

    remove('token')

    window.location.href = import.meta.env.DEV
      ? `${import.meta.env.VITE_XO_REST_BASE_URL}/signin#/`
      : `${window.origin}/signin#/`
  }

  return {
    logout,
  }
}
