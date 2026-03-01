import { describe, it, expect } from 'vitest'
import { adapterRegistry } from '../src/index.js'

describe('adapterRegistry', () => {
  it('registers and retrieves gumtree adapter', () => {
    const adapter = adapterRegistry.get('gumtree')
    expect(adapter).toBeDefined()
    expect(adapter?.name).toBe('gumtree')
  })

  it('registers and retrieves generic-html adapter', () => {
    const adapter = adapterRegistry.get('generic-html')
    expect(adapter).toBeDefined()
    expect(adapter?.name).toBe('generic-html')
  })

  it('registers and retrieves facebook adapter', () => {
    const adapter = adapterRegistry.get('facebook')
    expect(adapter).toBeDefined()
    expect(adapter?.name).toBe('facebook')
  })

  it('registers and retrieves llm adapter', () => {
    const adapter = adapterRegistry.get('llm')
    expect(adapter).toBeDefined()
    expect(adapter?.name).toBe('llm')
  })

  it('returns undefined for unknown adapter name', () => {
    expect(adapterRegistry.get('unknown-site')).toBeUndefined()
  })

  it('lists all registered adapter names', () => {
    const names = adapterRegistry.list()
    expect(names).toContain('gumtree')
    expect(names).toContain('generic-html')
    expect(names).toContain('facebook')
    expect(names).toContain('llm')
  })
})
