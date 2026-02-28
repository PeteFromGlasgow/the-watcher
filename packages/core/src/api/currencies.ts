export function setupCurrenciesApi(apiUrl: string, getJwt: () => Promise<string | undefined>) {
  return {
    async list<T>(query?: string): Promise<T[]> {
      const jwt = await getJwt()
      const queryString = query ? new URLSearchParams({ query }).toString() : ''
      const response = await fetch(`${apiUrl}/currencies?${queryString}`, {
        method: 'GET',
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        }
      })
      if (!response.ok) {
        console.log(response.status)
        throw new Error(`Failed to fetch currencies: ${response.statusText} ${await response.json()}`)
      }
      return response.json()
    },
    async get<T>(code: string): Promise<T[]> {
      const jwt = await getJwt()
      const response = await fetch(`${apiUrl}/currencies/${code}`, {
        method: 'GET',
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        }
      })
      if (!response.ok) {
        console.log(response.status)
        throw new Error(`Failed to fetch currency: ${response.statusText} ${await response.json()}`)
      }
      return response.json()
    }
  }
}
