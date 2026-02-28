import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

describe('marketing package configuration', () => {
  it('should have a valid package.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('@in-the-black/marketing')
    expect(pkg.type).toBe('module')
    expect(pkg.scripts.build).toBeDefined()
    expect(pkg.scripts.lint).toBeDefined()
    expect(pkg.scripts.test).toBeDefined()
  })

  it('should have an astro config', () => {
    expect(existsSync(resolve(root, 'astro.config.mjs'))).toBe(true)
  })

  it('should have a tsconfig', () => {
    expect(existsSync(resolve(root, 'tsconfig.json'))).toBe(true)
  })

  it('should have the index page', () => {
    expect(existsSync(resolve(root, 'src/pages/index.astro'))).toBe(true)
  })

  it('should have the base layout', () => {
    expect(existsSync(resolve(root, 'src/layouts/base.astro'))).toBe(true)
  })

  it('should have all required components', () => {
    const components = ['nav', 'hero', 'features', 'pro-features', 'receipt-demo', 'pricing', 'notify-form', 'open-source', 'footer', 'money-flow-bg']
    for (const component of components) {
      expect(existsSync(resolve(root, `src/components/${component}.astro`))).toBe(true)
    }
  })

  it('should have global styles', () => {
    expect(existsSync(resolve(root, 'src/styles/global.css'))).toBe(true)
  })

  it('should have a favicon', () => {
    expect(existsSync(resolve(root, 'public/favicon.svg'))).toBe(true)
  })
})

describe('marketing page content', () => {
  it('should include pro features section', () => {
    const content = readFileSync(resolve(root, 'src/components/pro-features.astro'), 'utf-8')
    expect(content).toContain('Bank Sync')
    expect(content).toContain('Receipt Parsing')
    expect(content).toContain('Auto-Clearing')
  })

  it('should include pricing section with plans', () => {
    const content = readFileSync(resolve(root, 'src/components/pricing.astro'), 'utf-8')
    expect(content).toContain('Community')
    expect(content).toContain('Pro')
    expect(content).toContain('Team')
  })

  it('should reference open-source nature', () => {
    const content = readFileSync(resolve(root, 'src/components/open-source.astro'), 'utf-8')
    expect(content).toContain('open-source')
    expect(content).toContain('ISC')
  })

  it('should use GBP pricing', () => {
    const content = readFileSync(resolve(root, 'src/components/pricing.astro'), 'utf-8')
    expect(content).toContain('\\u00A36')
    expect(content).toContain('\\u00A310')
    expect(content).not.toContain('$8')
    expect(content).not.toContain('$14')
  })

  it('should have pre-launch flag in pricing', () => {
    const content = readFileSync(resolve(root, 'src/components/pricing.astro'), 'utf-8')
    expect(content).toContain('PRE_LAUNCH')
    expect(content).toContain('Get Notified')
    expect(content).toContain('#notify')
  })

  it('should have GDPR-compliant notify form', () => {
    const content = readFileSync(resolve(root, 'src/components/notify-form.astro'), 'utf-8')
    expect(content).toContain('consent')
    expect(content).toContain('type="checkbox"')
    expect(content).toContain('required')
    expect(content).toContain('/signup')
    expect(content).toContain('marketing_consent')
    expect(content).toContain('consent_text')
    expect(content).toContain('unsubscribe')
  })
})

describe('animations', () => {
  it('should have scroll-reveal data attributes on sections', () => {
    const components = ['hero', 'features', 'pro-features', 'pricing', 'open-source']
    for (const name of components) {
      const content = readFileSync(resolve(root, `src/components/${name}.astro`), 'utf-8')
      expect(content).toContain('data-reveal')
    }
  })

  it('should define keyframe animations in global css', () => {
    const css = readFileSync(resolve(root, 'src/styles/global.css'), 'utf-8')
    expect(css).toContain('@keyframes fade-up')
    expect(css).toContain('@keyframes fly-to-pot')
    expect(css).toContain('@keyframes float')
    expect(css).toContain('@keyframes shimmer')
  })

  it('should include reduced-motion media query', () => {
    const css = readFileSync(resolve(root, 'src/styles/global.css'), 'utf-8')
    expect(css).toContain('prefers-reduced-motion')
  })

  it('should have IntersectionObserver script in base layout', () => {
    const layout = readFileSync(resolve(root, 'src/layouts/base.astro'), 'utf-8')
    expect(layout).toContain('IntersectionObserver')
    expect(layout).toContain('initScrollReveal')
  })

  it('should have receipt demo with categorization animation', () => {
    const content = readFileSync(resolve(root, 'src/components/receipt-demo.astro'), 'utf-8')
    expect(content).toContain('receipt-demo')
    expect(content).toContain('categorized')
    expect(content).toContain('pot-badge')
    expect(content).toContain('scan-line')
  })

  it('should integrate money-flow background in hero', () => {
    const hero = readFileSync(resolve(root, 'src/components/hero.astro'), 'utf-8')
    expect(hero).toContain('MoneyFlowBg')
    expect(hero).toContain('money-flow-bg')
  })
})

describe('accessibility', () => {
  it('should have a skip-to-content link in base layout', () => {
    const layout = readFileSync(resolve(root, 'src/layouts/base.astro'), 'utf-8')
    expect(layout).toContain('#main-content')
    expect(layout).toContain('Skip to main content')
    expect(layout).toContain('sr-only')
  })

  it('should have main content landmark with id in index page', () => {
    const index = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf-8')
    expect(index).toContain('id="main-content"')
  })

  it('should have aria-label on main nav and mobile menu controls', () => {
    const nav = readFileSync(resolve(root, 'src/components/nav.astro'), 'utf-8')
    expect(nav).toContain('aria-label="Main navigation"')
    expect(nav).toContain('aria-expanded')
    expect(nav).toContain('aria-controls="mobile-menu"')
    expect(nav).toContain('mobile-menu-toggle')
  })

  it('should have aria-labelledby on content sections', () => {
    const sections = [
      { file: 'features.astro', id: 'features-heading' },
      { file: 'pro-features.astro', id: 'pro-heading' },
      { file: 'pricing.astro', id: 'pricing-heading' },
      { file: 'open-source.astro', id: 'oss-heading' },
      { file: 'notify-form.astro', id: 'notify-heading' }
    ]
    for (const { file, id } of sections) {
      const content = readFileSync(resolve(root, `src/components/${file}`), 'utf-8')
      expect(content).toContain(`aria-labelledby="${id}"`)
      expect(content).toContain(`id="${id}"`)
    }
  })

  it('should have aria-hidden on decorative elements', () => {
    const features = readFileSync(resolve(root, 'src/components/features.astro'), 'utf-8')
    expect(features).toContain('aria-hidden="true"')

    const proFeatures = readFileSync(resolve(root, 'src/components/pro-features.astro'), 'utf-8')
    expect(proFeatures).toContain('aria-hidden="true"')

    const hero = readFileSync(resolve(root, 'src/components/hero.astro'), 'utf-8')
    expect(hero).toContain('aria-hidden="true"')
  })

  it('should have proper form labels and aria-live on notify form', () => {
    const form = readFileSync(resolve(root, 'src/components/notify-form.astro'), 'utf-8')
    expect(form).toContain('for="notify-email"')
    expect(form).toContain('id="notify-email"')
    expect(form).toContain('for="notify-consent"')
    expect(form).toContain('id="notify-consent"')
    expect(form).toContain('aria-live="polite"')
    expect(form).toContain('aria-live="assertive"')
    expect(form).toContain('role="status"')
    expect(form).toContain('role="alert"')
  })

  it('should have focus-visible styles in global CSS', () => {
    const css = readFileSync(resolve(root, 'src/styles/global.css'), 'utf-8')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('.sr-only')
  })

  it('should have footer navigation with aria-label', () => {
    const footer = readFileSync(resolve(root, 'src/components/footer.astro'), 'utf-8')
    expect(footer).toContain('aria-label="Footer navigation"')
    expect(footer).toContain('role="contentinfo"')
  })

  it('should use serif font for section headings', () => {
    const css = readFileSync(resolve(root, 'src/styles/global.css'), 'utf-8')
    expect(css).toContain('Playfair Display')
    expect(css).toContain('--font-serif')

    const hero = readFileSync(resolve(root, 'src/components/hero.astro'), 'utf-8')
    expect(hero).toContain('font-serif')

    const features = readFileSync(resolve(root, 'src/components/features.astro'), 'utf-8')
    expect(features).toContain('font-serif')
  })
})
