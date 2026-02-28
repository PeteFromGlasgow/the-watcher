export function setupAccountTypesApi(apiUrl: string, getJwt: () => Promise<string | undefined>) {
  return {
    async list<T>(query?: string): Promise<T[]> {
      const jwt = await getJwt()
      const queryString = query ? new URLSearchParams({ query }).toString() : ''
      const response = await fetch(`${apiUrl}/account-types?${queryString}`, {
        method: 'GET',
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        }
      })
      if (!response.ok) {
        console.log(response.status)
        throw new Error(`Failed to fetch account types: ${response.statusText} ${await response.json()}`)
      }
      return response.json()
    },
    async get<T>(id: string): Promise<T> {
      const jwt = await getJwt()
      const response = await fetch(`${apiUrl}/account-types/${id}`, {
        method: 'GET',
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        }
      })
      if (!response.ok) {
        console.log(response.status)
        throw new Error(`Failed to fetch account type: ${response.statusText} ${await response.json()}`)
      }
      return response.json()
    }
  }
}
