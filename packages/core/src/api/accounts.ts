export function setupAccountsApi(apiUrl: string, getJwt: () => Promise<string | undefined>) {
  return {
    async list<T>(query?: string): Promise<T[]> {
      const jwt = await getJwt()
      const queryString = query ? new URLSearchParams({ query }).toString() : ''
      const response = await fetch(`${apiUrl}/accounts?${queryString}`, {
        method: 'GET',
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        }
      })
      if (!response.ok) {
        console.log(response.status)
        throw new Error(`Failed to fetch accounts: ${response.statusText} ${await response.json()}`)
      }
      return response.json()
    },
    async get<T>(uuid: string): Promise<T[]> {
      const jwt = await getJwt()
      const response = await fetch(`${apiUrl}/accounts/${uuid}`, {
        method: 'GET',
        headers: {
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        }
      })
      if (!response.ok) {
        console.log(response.status)
        throw new Error(`Failed to fetch account: ${response.statusText} ${await response.json()}`)
      }
      return response.json()
    },
    async create<T>(input: { account_type_id: string, name: string, balance: number, currency_id: string }): Promise<T> {
      const jwt = await getJwt()
      const response = await fetch(`${apiUrl}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify(input)
      })
      if (!response.ok) {
        console.log(response.status)
        throw new Error(`Failed to create account: ${response.statusText} ${await response.json()}`)
      }
      return response.json()
    },
    async update<T>(id: string, input: { name?: string, account_type_id?: string }): Promise<T> {
      const jwt = await getJwt()
      const response = await fetch(`${apiUrl}/accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify(input)
      })
      if (!response.ok) {
        console.log(response.status)
        throw new Error(`Failed to update account: ${response.statusText} ${await response.json()}`)
      }
      return response.json()
    },
    async types<T>(query?: string): Promise<T[]> {
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
    }
  }
}
