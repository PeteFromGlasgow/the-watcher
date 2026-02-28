import { Configuration, FrontendApi, type Session } from '@ory/kratos-client'

export const useAuth = () => {
  const session = useState<Session | null>('session', () => null)
  const isLoading = useState<boolean>('authLoading', () => true)
  const config = useRuntimeConfig()
  const router = useRouter()

  const kratos = new FrontendApi(
    new Configuration({
      basePath: config.public.kratosPublicUrl as string || 'http://localhost:4433'
    })
  )

  const fetchSession = async () => {
    isLoading.value = true
    try {
      const { data } = await kratos.toSession({}, { withCredentials: true })
      session.value = data
    } catch (error) {
      session.value = null
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      const { data } = await kratos.createBrowserLogoutFlow({}, { withCredentials: true })
      await kratos.updateLogoutFlow({ token: data.logout_token }, { withCredentials: true })
      session.value = null
      router.push('/login')
    } catch (error) {
      console.error(error)
    }
  }

  return {
    session,
    isLoading,
    fetchSession,
    logout
  }
}
