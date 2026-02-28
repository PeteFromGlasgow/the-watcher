import { describe, it, expect } from 'vitest'
import { getHelloWorld } from '../src/index.js'

describe('helloWorld', () => {
  it('Should return "Hello Ben!" when given "Ben" as an argument', async () => {
    let result: string | null = null
    const helloWorld = getHelloWorld(i => result = i)
    helloWorld('Ben')
    expect(result).to.equal('Hello Ben!')
  })
})
