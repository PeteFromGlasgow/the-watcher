import { describe, bench } from 'vitest'
import { parse } from '../src/index.js'

describe('Query Language Parser Benchmarks', () => {
  bench('parse a simple expression', () => {
    const inputText = '(field eq \'value\')'
    parse(inputText)
  })
})
