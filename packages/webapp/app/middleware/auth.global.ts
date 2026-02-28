export default defineNuxtRouteMiddleware((to) => {
  const publicPages = ['/login', '/registration', '/verification', '/recovery', '/error', '/consent']
  const isPublicPage = publicPages.some(page => to.path === page || to.path.startsWith(page + '/'))

  if (isPublicPage) {
    return
  }

  const { session, isLoading } = useAuth()

  if (!isLoading.value && !session.value) {
    return navigateTo('/login')
  }
})
