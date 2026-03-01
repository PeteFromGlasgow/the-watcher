import { adapterRegistry } from './registry.js'
import { FacebookAdapter } from './facebook/index.js'
import { GumtreeAdapter } from './gumtree/index.js'
import { GenericHtmlAdapter } from './generic-html/index.js'
import { LlmAdapter } from './llm/index.js'

adapterRegistry.register(new FacebookAdapter())
adapterRegistry.register(new GumtreeAdapter())
adapterRegistry.register(new GenericHtmlAdapter())
adapterRegistry.register(new LlmAdapter())

export { adapterRegistry }
export type { Adapter } from './adapter.js'
