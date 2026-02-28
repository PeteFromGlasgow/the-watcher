import { setupAccountsApi } from './api/accounts.js'
import { setupAccountTypesApi } from './api/accountTypes.js'
import { setupCurrenciesApi } from './api/currencies.js'

export function createApi(apiUrl: string, getJwt: () => Promise<string | undefined>) {
  return {
    currencies: setupCurrenciesApi(apiUrl, getJwt),
    accounts: setupAccountsApi(apiUrl, getJwt),
    accountTypes: setupAccountTypesApi(apiUrl, getJwt)

  }
}
