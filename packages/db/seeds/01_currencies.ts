import type { Knex } from 'knex'
import { parse } from 'csv-parse/sync'

const CURRENCIES_TABLE = 'currencies'

interface CurrencyRecord {
  AlphabeticCode: string
  Currency: string
  MinorUnit: string
  WithdrawalDate: string
}

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex(CURRENCIES_TABLE).del()

  // Inserts seed entries
  const response = await fetch(
    'https://raw.githubusercontent.com/datasets/currency-codes/main/data/codes-all.csv'
  )
  const csv = await response.text()
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true
  })

  const currencies = Object.values(
    (records as CurrencyRecord[])
      .filter(
        record =>
          record.AlphabeticCode
          && record.Currency
          && record.WithdrawalDate === ''
          && !isNaN(parseInt(record.MinorUnit, 10))
      )
      .reduce(
        (acc, record) => {
          acc[record.AlphabeticCode] = {
            code: record.AlphabeticCode,
            name: record.Currency,
            decimal_digits: parseInt(record.MinorUnit, 10)
          }
          return acc
        },
        {} as Record<string, Omit<CurrencyRecord, 'AlphabeticCode' | 'Currency' | 'MinorUnit' | 'WithdrawalDate'> & { code: string, name: string, decimal_digits: number }>
      )
  )

  await knex(CURRENCIES_TABLE).insert(currencies)
}
