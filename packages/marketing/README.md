# @in-the-black/marketing

Astro-based marketing landing page for **In The Black** — a zero-sum budgeting application for power users.

## Quick Start

```bash
pnpm --filter @in-the-black/marketing dev      # Local dev server
pnpm --filter @in-the-black/marketing build    # Production build (astro check + astro build)
pnpm --filter @in-the-black/marketing lint     # ESLint
pnpm --filter @in-the-black/marketing test     # Vitest
```

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 5 (static output) |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| Animations | CSS keyframes + IntersectionObserver |
| Type checking | `@astrojs/check` (strict mode) |
| Testing | Vitest (structure and content assertions) |
| Linting | Shared monorepo ESLint config |

## Directory Structure

```
packages/marketing/
├── astro.config.mjs            # Astro + Tailwind Vite plugin
├── tsconfig.json               # Extends astro/tsconfigs/strict
├── package.json                # Build/lint/test scripts
├── public/
│   └── favicon.svg             # Brand favicon
├── src/
│   ├── styles/global.css       # Tailwind theme, keyframes, animation system
│   ├── layouts/base.astro      # HTML shell, scroll-reveal + count-up scripts
│   ├── pages/index.astro       # Main landing page (component composition)
│   └── components/
│       ├── nav.astro           # Fixed navigation bar
│       ├── hero.astro          # Hero with animated dashboard preview
│       ├── features.astro      # Core feature grid (6 items)
│       ├── pro-features.astro  # Premium feature cards (3 items)
│       ├── receipt-demo.astro  # Interactive receipt → pot categorization demo
│       ├── pricing.astro       # Three-tier pricing table (PRE_LAUNCH flag)
│       ├── notify-form.astro   # GDPR-compliant email signup form
│       ├── open-source.astro   # OSS credibility section
│       └── footer.astro        # Minimal footer
└── test/
    └── config.test.ts          # 16 tests covering structure, content, animations
```

---

## Page Architecture & Marketing Theory

The page follows a deliberate persuasion sequence. Every section is placed where it is for a psychological reason, and every animation serves a communication purpose.

### Section Order (Persuasion Funnel)

```
Nav         → Persistent orientation + CTA anchor
Hero        → Emotional hook + product identity
Features    → Rational credibility (core value)
Pro         → Aspiration + premium framing
Receipt     → Proof via demonstration
Pricing     → Decision framework (pre-launch: drives to notify form)
Notify Form → Lead capture (GDPR-compliant, pre-launch only)
Open Source  → Trust / risk reduction
Footer      → Closure
```

This follows the **AIDA model** (Attention → Interest → Desire → Action) mapped onto a scrolling page:

| AIDA Stage | Section(s) | Mechanism |
|------------|-----------|-----------|
| **Attention** | Hero | Bold headline, animated dashboard, pulsing background |
| **Interest** | Features | Rational feature grid addresses "what does it do?" |
| **Desire** | Pro Features + Receipt Demo | Aspirational premium tier + visceral demonstration |
| **Action** | Pricing + Notify Form + Open Source | Decision framework + lead capture + risk removal |

### 1. Hero — First 5 Seconds

**Psychology: The Serial Position Effect + Anchoring**

Users form an opinion about a product within 50ms of seeing a page (Lindgaard et al., 2006). The hero must accomplish three things before the user scrolls:

1. **Identity** — "Your money. Accounted for." is a deliberate double entendre. "Accounted for" means both "taken care of" (emotional reassurance) and "recorded in accounts" (literal accuracy). This ties the brand name "In The Black" (an accounting idiom for profitability) to the product's core mechanic (double-entry bookkeeping).

2. **Social proof shorthand** — The badge ("Open Source · Self-Hostable · Pro Features Available") addresses the three most common objections of the target persona (power users who distrust closed-source SaaS) in a single line.

3. **Product preview** — The floating mini-dashboard showing `£2,400 Income / £1,850 Assigned / £550 Unassigned` with a progress bar is a **concrete demonstration of the end state** the user is buying. This exploits the **Goal Gradient Effect** (Hull, 1932) — people are motivated by visible progress toward a goal. The partially-filled bar implies "your budget is almost complete" and creates implicit forward momentum.

**Why the previous tagline was changed:** The original "Every dollar. A job." is dangerously close to YNAB's trademarked tagline "Give Every Dollar a Job." Beyond the legal risk, positioning against an incumbent with their own language puts you in their frame. "Your money. Accounted for." creates a distinct frame that emphasises accuracy and control — differentiators over YNAB's more emotional "intentionality" positioning.

### 2. Features — Rational Credibility

**Psychology: The Elaboration Likelihood Model (Petty & Cacioppo, 1986)**

Power users process information via the **central route** — they need feature specifics, not emotional appeals. The 6-card grid is designed for:

- **Scanning** — Each card has an icon, a title, and one sentence. A power user can evaluate all six features in under 10 seconds.
- **Staggered reveal** — Cards animate in with 100ms delays (left-to-right, top-to-bottom). This exploits **temporal attention** — the brain processes items that appear sequentially as a coherent narrative rather than a wall of content.
- **Hover-lift** — The subtle translateY(-4px) on hover provides **haptic feedback** (motor confirmation of interactivity), which increases perceived quality.

**Copy decisions:**
- "Zero-Sum Methodology" — Uses the technical term. The target user already knows what this means; explaining it would be condescending and create doubt ("is this product actually for experts?").
- "Clearing House" — Named after the real financial concept. Again, signalling domain expertise.
- "Spreadsheet-Speed UI" — Directly addresses the #1 complaint about YNAB and competitors: they're slow. A concrete, falsifiable claim.

### 3. Pro Features — Aspiration + Premium Anchoring

**Psychology: The Decoy Effect + Colour Semiotics**

Each pro feature card uses a distinct colour:
- **Gold** (Bank Sync) — Gold universally signals premium/luxury. This is the "headline" pro feature.
- **Violet** (AI Receipt Parsing) — Violet signals intelligence, creativity, futurism. Associates AI with sophistication rather than hype.
- **Emerald** (Auto-Clearing) — Emerald signals the core brand. This feature automates a core feature (Clearing House), so using the core brand colour reinforces the upgrade path from free → pro.

The **shimmer effect** on these cards creates a subtle "premium material" feel (like the glint on a credit card) while the staggered reveal makes them feel like they're being "unveiled."

### 4. Receipt Demo — The Proof Moment

**Psychology: The Picture Superiority Effect + Processing Fluency**

This is the most important marketing element on the page. Research shows that demonstrations are 6x more persuasive than feature descriptions (Paivio, 1971). The receipt demo works in three timed phases:

1. **Receipt appears** (0–600ms) — A realistic receipt slides up with a paper-like card. The dashed border and mono font trigger "receipt schema" in the user's memory — they immediately understand what they're looking at without reading a word.

2. **AI scan line** (600–2100ms) — A violet gradient line sweeps down the receipt, mimicking an OCR scanner. This creates a **causal narrative** — the user perceives the AI "reading" the receipt in real time.

3. **Items fly to pots** (2200ms+) — Each line item animates toward its corresponding budget pot category. The items are colour-coded to match their destination pot, so the user can visually track "Sourdough Loaf (green dot) → Groceries (green card)."

**Why this works:** The demo converts an abstract feature ("AI receipt parsing") into a **concrete, visceral experience**. The user doesn't have to imagine what the feature does — they watch it happen. This is the **Show, Don't Tell** principle applied to SaaS marketing.

**Mobile adaptation:** On screens below `md` (768px), the grid stacks vertically, so the fly-to-pot animation redirects items downward (Y-axis) rather than rightward. This prevents items from flying off-screen.

**Pot data design:** The receipt uses realistic UK grocery items (Organic Avocados, Sourdough Loaf, Oat Milk Latte) that map to distinct budget categories. This demonstrates both granularity (5 items → 4 categories) and that the AI can distinguish between closely-related items (avocados and sourdough → Groceries, but latte → Coffee).

### 5. Pricing — Decision Architecture

**Psychology: The Compromise Effect (Simonson, 1989)**

Three-tier pricing exploits the **centre-stage effect** — when presented with three options, people disproportionately choose the middle one. The tiers are structured:

| | Community | Pro | Team |
|---|---|---|---|
| Price | Free | £6/mo | £10/mo |
| Role | Anchor (establishes value of core) | Target (what we want users to buy) | Aspirational (makes Pro look reasonable) |

- **Community (Free)** exists to establish that the core is genuinely valuable — 8 full features — so that Pro's additional features feel like a genuine upgrade rather than a paywall.
- **Pro (£6/mo)** is visually emphasised with a gold border, gradient background, and "Recommended" badge. It lists 6 features starting with "Everything in Community" to reinforce the upgrade framing.
- **Team (£10/mo)** exists as a **price anchor** — at nearly double the Pro price, it makes Pro feel like a bargain by comparison. It also signals that the product scales to teams, increasing perceived longevity.

#### Pre-Launch Mode

The `PRE_LAUNCH` flag (a constant at the top of `pricing.astro`) controls the CTA behaviour:

- **`PRE_LAUNCH = true`** (current): All plan CTAs become "Get Notified" and anchor-link to `#notify` (the email signup form below). This captures leads before the product is available.
- **`PRE_LAUNCH = false`** (post-launch): CTAs revert to their original labels ("Get Started", "Start Pro Trial", "Start Team Trial") and can link to the actual signup/checkout flow.

**Why "Recommended" not "Most Popular":** The original badge said "Most Popular," which is a factual claim. For a pre-launch product with no users, this is deceptive. "Recommended" is an editorial opinion, which is honest and achieves the same visual emphasis. This matters for trust — the target persona (power users, developers, open-source enthusiasts) is highly attuned to manipulative marketing and will disengage if they detect dishonesty.

**Currency:** All pricing is in GBP (£), matching the UK launch market and the product's OpenBanking focus. The hero dashboard and receipt demo also use GBP for consistency.

### 6. Notify Form — Pre-Launch Lead Capture

**Psychology: The Zeigarnik Effect + Commitment Escalation**

When `PRE_LAUNCH = true`, all pricing CTAs anchor-link to the notify form. The form captures email addresses for launch announcements while maintaining GDPR compliance.

**GDPR compliance features:**
- **Explicit consent checkbox** — Required, with clear consent text: "I agree to receive product launch and update emails from In The Black. I understand I can unsubscribe at any time."
- **Consent text recording** — The exact consent wording is sent to the API and stored alongside the email, so there's an auditable record of what the user agreed to.
- **IP address and user agent** — Captured server-side for compliance evidence.
- **Unsubscribe endpoint** — `DELETE /signup` sets `unsubscribed_at` and `marketing_consent: false` (soft delete, preserving audit trail).
- **Privacy link** — Footer text with unsubscribe promise and privacy policy link.

**Backend architecture:**
- **API route** — `POST /signup` and `DELETE /signup` on the API gateway (no auth required).
- **Database** — `email_signups` table with UUID PK, unique email constraint, upsert on conflict (re-subscribing re-consents).
- **Migration** — `packages/db/migrations/20260206010000_create_email_signups_table.ts`

**Why the form is between Pricing and Open Source:** After the user has seen the pricing (decision framework), they're in a "ready to act" mindset. The form provides an immediate, low-commitment action. Placing Open Source after the form provides post-action reassurance — "I just gave them my email, and they're open source, so I can trust them."

### 7. Open Source — Risk Reduction

**Psychology: The Endowment Effect + Loss Aversion (Kahneman & Tversky, 1979)**

The open-source section addresses the #1 risk for the target persona: vendor lock-in. Power users and self-hosters fear losing access to their financial data if a SaaS shuts down.

The three stat cards (100% / ISC / K8s) are each a **risk-reduction signal**:
- **100% Core features free** — "You can use this forever without paying" (eliminates financial risk).
- **ISC License** — "You can fork this if we disappear" (eliminates vendor risk).
- **K8s Native** — "You can run this on your own infrastructure" (eliminates platform risk).

The count-up animation on "100%" creates a **moment of arrival** — the number ticking from 0 to 100 feels like a reward, reinforcing the generosity of the free tier.

---

## Animation System

### Philosophy

Animations serve three purposes:
1. **Orientation** — Scroll-reveal tells the user "this is new content" without requiring them to consciously scan.
2. **Narrative** — Staggered reveals create implicit left-to-right, top-to-bottom reading order.
3. **Delight** — The receipt demo, floating dashboard, and hover-lift effects create moments of surprise that increase engagement time.

### Implementation

All animations are CSS-driven (no JavaScript animation libraries) for performance:

| System | Mechanism | Trigger |
|--------|-----------|---------|
| Scroll-reveal | `data-reveal` attribute → `.revealed` class | IntersectionObserver (15% threshold) |
| Stagger | `data-stagger` attribute → nth-child delays | Same observer, applied to parent |
| Receipt demo | `.active` → `.categorized` class progression | Dedicated IntersectionObserver (30% threshold) |
| Count-up | `data-count` attribute → JS interval | IntersectionObserver (50% threshold) |
| Hover effects | `.hover-lift` class | CSS `:hover` pseudo-class |
| Background | `.animate-pulse-glow`, `.animate-float` | CSS `animation` (always running) |

### Timing

Delays are calibrated so animations complete before the user scrolls past:

- **Scroll-reveal:** 700ms duration, triggered at 15% visibility. Most users scroll at ~2 viewport-heights/second, so an element is visible for ~500ms before the user would scroll past. The -40px rootMargin triggers slightly early to ensure animations start before the element is fully in view.
- **Receipt demo:** 2200ms total (600ms appear + 1500ms scan + staggered flight). The 30% threshold ensures the user has scrolled far enough to see both the receipt and pots columns.

### Accessibility

All animations respect `prefers-reduced-motion: reduce`:
- Scroll-reveal elements render at full opacity immediately.
- Receipt demo shows all elements without transitions.
- Hover-lift effect is disabled.
- Shimmer is disabled.
- Floating/pulsing animations are disabled.

---

## Design Decisions Log

### Tagline: "Your money. Accounted for."

**Changed from:** "Every dollar. A job."

**Reason:** The original phrasing is too close to YNAB's trademarked "Give Every Dollar a Job." This creates:
1. **Legal risk** — trademark infringement or unfair competition claims.
2. **Positioning risk** — using a competitor's language puts you in their frame. Prospects mentally file you as "a YNAB clone" rather than a distinct product.
3. **Currency bias** — "dollar" is US-centric while the product originates from Scotland and uses OpenBanking (primarily a UK/EU standard).

The replacement "Your money. Accounted for." creates a distinct identity:
- "Accounted for" is a **double entendre** — emotional ("taken care of") and literal ("in the accounts").
- It connects to the product name "In The Black" (both are accounting idioms).
- It's currency-neutral.

### Pricing Badge: "Recommended"

**Changed from:** "Most Popular"

**Reason:** "Most Popular" is a factual claim that requires evidence. For a pre-launch product with zero users, it's demonstrably false. The target persona (developers, power users, open-source enthusiasts) is highly sensitive to deceptive marketing — a single dishonest claim can destroy trust for the entire page. "Recommended" is an editorial opinion, which is honest and achieves the same visual emphasis without the credibility risk.

### Currency: GBP Throughout

**Changed from:** USD pricing ($8/$14) with GBP in demos.

**Reason:** The UK is the launch market and OpenBanking is a UK/EU standard. Using GBP throughout (£6/£10 pricing, £ in hero and receipt demo) is honest and consistent. The original mixed-currency approach created unnecessary confusion — users would see £ in the demo then $ in pricing and wonder if the product was US-focused after all.

### Feature Copy: Currency-Neutral Language

**Changed from:** "Assign every dollar a purpose"

**Changed to:** "Give every pound, dollar, and euro a purpose"

**Reason:** Multi-currency support is a genuine product feature. Using it in the copy both avoids the YNAB echo and actively demonstrates a differentiator.

### Mobile Receipt Animation

**Change:** Added `@media (max-width: 767px)` override that redirects `fly-to-pot` from `--fly-x: 280px` (horizontal) to `--fly-x: 0px; --fly-y: 60px` (vertical).

**Reason:** On mobile, the `md:grid-cols-2` layout stacks into a single column, placing pots below the receipt rather than beside it. Without this fix, line items would animate 280px to the right, flying off-screen.

---

## Colour System

| Token | Hex | Role |
|-------|-----|------|
| `midnight` | `#0f172a` | Page background |
| `deep-navy` | `#1e293b` | Card backgrounds, elevated surfaces |
| `slate-dark` | `#334155` | Borders, dividers |
| `slate-mid` | `#64748b` | Tertiary text, labels |
| `slate-light` | `#94a3b8` | Body text |
| `ice` | `#e2e8f0` | Primary text |
| `white` | `#ffffff` | Headings, emphasis |
| `emerald` | `#10b981` | **Brand primary** — CTAs, core features, positive values |
| `gold` | `#f59e0b` | **Premium** — Pro badge, bank sync, pricing highlight |
| `violet` | `#8b5cf6` | **Intelligence** — AI features, receipt parsing |
| `sky` | `#38bdf8` | **Utility** — Household category accent |
| `rose` | `#f43f5e` | **Reserved** — Error states, alerts (unused on marketing page) |

The dark palette (`midnight` → `deep-navy` → `slate-dark`) creates a "terminal / dashboard" feel that resonates with the power-user target audience. It also makes the accent colours (emerald, gold, violet) pop with high contrast.

---

## Testing

19 tests across 3 suites:

| Suite | Tests | What It Verifies |
|-------|-------|-----------------|
| Package configuration | 8 | package.json, astro config, tsconfig, pages, layouts, components (incl. notify-form), styles, favicon |
| Marketing content | 6 | Pro features copy, pricing tiers, open-source messaging, GBP pricing, pre-launch flag, GDPR notify form |
| Animations | 5 | data-reveal attributes, keyframes, reduced-motion, IntersectionObserver, receipt demo |

Run with:
```bash
pnpm --filter @in-the-black/marketing test
```

---

## Future Considerations

- **Social proof section** — Add testimonials or beta user quotes once available. Currently omitted because fabricated testimonials would undermine the trust the open-source section builds.
- **Video demo** — The receipt animation demonstrates the concept, but a screen recording of the actual product would be more persuasive once the UI exists.
- **A/B testing** — The pricing tiers and CTA copy are informed hypotheses. Real conversion data should drive iteration.
- **Blog / changelog** — A `/blog` route for product updates would improve SEO and give returning visitors a reason to come back.
- **i18n** — The page is English-only. Given the UK/EU OpenBanking focus, localised versions (DE, FR, ES) would expand reach.
