import type { Adapter } from './adapter.js'

class AdapterRegistry {
  private adapters = new Map<string, Adapter>()

  register(adapter: Adapter): void {
    this.adapters.set(adapter.name, adapter)
  }

  get(name: string): Adapter | undefined {
    return this.adapters.get(name)
  }

  list(): string[] {
    return Array.from(this.adapters.keys())
  }
}

export const adapterRegistry = new AdapterRegistry()
