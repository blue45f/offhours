---
name: Offhours
description: >-
  Quiet Luxury + Korean Restraint design system for a two-sided marketplace that
  rents commercial venues (cafes, bars, studios, galleries) during their
  off-business-hours. Deep Olive primary, a single rare Burnt Sienna accent, warm
  cream neutrals that never touch pure black or white, generous Korean whitespace,
  and quiet 240ms motion. Flat by default with tonal layering; shadows are reserved
  for overlays and hover only.
colors:
  primary: '#5a6f4f'
  primary-hover: '#4a5f3f'
  primary-active: '#3a4b32'
  primary-soft: '#e8eee5'
  accent-sienna: '#c97550'
  accent-soft: '#ffe5d2'
  cream-bg: '#faf8f4'
  cream-elevated: '#ffffff'
  cream-subtle: '#f1eee7'
  ink: '#1a1814'
  fg-muted: '#67604f'
  fg-subtle: '#847b6a'
  border: '#e5e0d5'
  border-strong: '#c8c1b3'
  success: '#2f8f5e'
  warning: '#c9942e'
  error: '#b33a3a'
  info: '#3d6f8f'
typography:
  display:
    fontFamily: "'Noto Serif KR', 'Pretendard Variable', serif"
    fontSize: clamp(2.25rem, 1.6rem + 2.6vw, 3.75rem)
    fontWeight: 700
    lineHeight: '1.1'
    letterSpacing: '-0.02em'
  headline:
    fontFamily: "'Noto Serif KR', 'Pretendard Variable', serif"
    fontSize: clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)
    fontWeight: 700
    lineHeight: '1.15'
    letterSpacing: '-0.02em'
  title:
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
    fontSize: clamp(1.375rem, 1.2rem + 0.7vw, 1.625rem)
    fontWeight: 600
    lineHeight: '1.3'
    letterSpacing: '0'
  body:
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
    fontSize: clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)
    fontWeight: 400
    lineHeight: '1.55'
    letterSpacing: '0'
  label:
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
    fontSize: clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)
    fontWeight: 500
    lineHeight: '1.3'
    letterSpacing: '0.01em'
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  xl: 18px
  2xl: 24px
  pill: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  '10': 40px
  '12': 48px
  '16': 64px
  '20': 80px
  '24': 96px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#ffffff'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    padding: 0 16px
    height: 40px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '#ffffff'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    padding: 0 16px
    height: 40px
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.lg}'
    padding: 0 16px
    height: 40px
  card:
    backgroundColor: '{colors.cream-elevated}'
    textColor: '{colors.ink}'
    rounded: '{rounded.xl}'
    padding: 24px
  input:
    backgroundColor: '{colors.cream-elevated}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.lg}'
    padding: 0 14px
    height: 44px
  chip-selected:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.cream-bg}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 0 14px
    height: 36px
  badge-soft:
    backgroundColor: '{colors.primary-soft}'
    textColor: '{colors.primary}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: 4px 10px
---

# Offhours Design System

## 1. Overview

**Creative North Star: "The Lights Stay On After Closing."**

Offhours is built on a single quiet image: a beautiful cafe an hour after its last
customer leaves, the chairs still warm, the evening light going amber — a space at
its most cinematic precisely when it is officially idle. The whole interface exists
to make that _off-hour_ feel like a discovery, not a discount bin. Every surface
should read like the inside of a well-edited space: warm, unhurried, confident
enough to leave things empty. The product sells **borrowed time in borrowed rooms**,
so the design treats restraint as the luxury. We are decorating the negative space
of someone else's business, and we honor it by adding almost nothing.

This is **Quiet Luxury filtered through Korean restraint (여백의 미)** — the beauty
of the deliberate blank. We lead with a single grounded Deep Olive and one rare
Burnt Sienna ember, set against warm creams that have never met pure black or pure
white. Typography carries the elegance (an optional Noto Serif KR headline over a
calm Pretendard body), not chrome. Motion is a slow exhale at 240ms with no bounce.
The off-hours theme is literal in the content surfaces too: an availability calendar
that quietly lights only the nights a venue opens after close, and last-minute
slots that surface like the lamp someone forgot to switch off.

What this system **explicitly rejects**: the loud information-density of legacy
Korean rental marketplaces (Spacecloud, Hourplace) where every card screams price,
badges, and stock counters; the cold pure-white-and-shadow SaaS look; bouncy
"delightful" micro-interactions; gradient-text hero theatrics and glassmorphism as
decoration; and the temptation to use the accent color as paint rather than as
punctuation. If a screen feels busy, it has failed.

**Key Characteristics:**

- **One primary, one accent.** Deep Olive does the work; Burnt Sienna appears on at
  most ~5% of any screen and only where the eye must land.
- **Warm neutrals only.** Cream backgrounds and a near-black ink — never `#000`/`#fff`.
- **Flat by default.** Depth comes from tonal layering and hairline borders; shadows
  appear only on overlays and on hover.
- **Generous Korean whitespace.** Low density, a 4px spacing grid, room to breathe.
- **Quiet motion.** 240ms base on a single decelerating curve; reduced-motion honored.
- **One typographic family.** Pretendard throughout, Noto Serif KR reserved for the
  emotional headline.
- **Mobile-first, 320px up.** Fluid type and progressive enhancement, always.

## 2. Colors

The palette is a warm, low-saturation room at dusk: olive, clay, and cream, with the
faintest ember. Color is used for meaning and orientation, never for energy.

**Primary — the grounded olive.**

- **Deep Olive** (`#5a6f4f`): the single brand color. Primary buttons, active calendar
  dates, links, price emphasis, focus rings.
- **Olive Hover** (`#4a5f3f`) / **Olive Active** (`#3a4b32`): the press-darker steps for
  the primary button; never used as fills elsewhere.
- **Olive Soft** (`#e8eee5`): the primary's whisper — selected-day washes, soft badges,
  active add-on rows, selection highlight.

**Secondary — the rare ember.**

- **Burnt Sienna** (`#c97550`): the one accent. Live "available tonight" slot badges,
  the favorited heart, a single eyebrow label, the rotating headline word. Its job is
  to be rare.
- **Sienna Soft** (`#ffe5d2`): the accent's tint for the last-minute slot pill — warm,
  quiet, never shouting.

**Neutral — the warm room.**

- **Cream Page** (`#faf8f4`): the default page background. The system never sits on white.
- **Cream Elevated** (`#ffffff`): reserved strictly for raised surfaces (cards, inputs,
  popovers) so elevation reads tonally, not by shadow.
- **Cream Subtle** (`#f1eee7`): hover beds and quiet panels.
- **Ink** (`#1a1814`): the warm near-black for primary text. Not `#000`.
- **Muted Ink** (`#67604f`) / **Subtle Ink** (`#847b6a`): secondary and tertiary text,
  meta lines, helper copy.
- **Border** (`#e5e0d5`) / **Border Strong** (`#c8c1b3`): hairline separators that do the
  structural work shadows would do elsewhere.
- **Status** — Success `#2f8f5e`, Warning `#c9942e`, Error `#b33a3a`, Info `#3d6f8f`: all
  muted and warmed to belong to the room; used as 14%-tinted soft badges by default.

> **Named Rule — The One Accent Rule.** Burnt Sienna (`#c97550`) never exceeds ~5% of any
> single screen. Its scarcity _is_ the luxury — the moment two accents compete, both lose.

> **Named Rule — No Pure Ink, No Pure Paper.** Text is warm ink (`#1a1814`), surfaces are
> warm cream — pure `#000` and `#fff` are banned because they break the dusk-lit warmth that
> makes an empty room feel inviting rather than clinical.

## 3. Typography

**Display & Headline — Noto Serif KR (optional), the emotional voice.** A high-contrast
Korean serif used only for the largest, feeling-led moments ("비어 있던 그 시간, 가장 멋진
공간이 됩니다"). Tight tracking, tight leading — it is the one place the system raises its
voice, and it does so with elegance, not size alone.

**Body & UI — Pretendard, the calm workhorse.** One variable family carries everything else:
labels, paragraphs, prices, forms. It reads cleanly in Korean and Latin, runs `ss03` font
features for refined numerals, and never competes with the headline.

**Mono — JetBrains Mono**, only for codes, tokens, and tabular figures (e.g. check-in codes).

**Hierarchy:**

- **Display** — weight 700, fluid 36→60px, line-height 1.1, tracking −0.02em. One per page;
  the hero promise.
- **Headline** — weight 700, fluid 28→40px, line-height 1.15, tracking −0.02em. Section
  openers ("어떤 모임이세요?").
- **Title** — weight 600, fluid 22→26px, line-height 1.3. Card titles, panel headers.
- **Body** — weight 400, fluid 16→17px, line-height 1.55. Default reading text.
- **Label / Meta** — weight 500, fluid 12→13px, line-height 1.3, tracking 0.01em, muted ink.
  Meta rows, chips, badges, helper copy.

> **Named Rule — The 65–75ch Measure.** Body copy is held to a 65–75 character line length so
> long Korean and Latin paragraphs stay restful; never let text run the full width of a wide
> container.

## 4. Elevation

**Flat by default; depth is tonal.** The system layers warm neutrals (page → subtle → elevated
white) and hairline borders to express hierarchy. **Shadows are forbidden at rest** — they
appear only when something genuinely floats (modals, popovers, toasts) or lifts under the
pointer (card hover). A resting card is defined by its `#ffffff` surface and a `#e5e0d5`
hairline, nothing more.

**Shadow vocabulary** (warm-tinted, never neutral gray):

- `--shadow-sm` — `0 1px 2px rgba(26,24,20,0.04)`: the faintest seat; primary buttons, hot/new
  pills, the floating thumbnail chip on a card hover.
- `--shadow-md` — `0 4px 12px rgba(26,24,20,0.08)`: popovers, dropdowns, and the lift a card
  earns on hover.
- `--shadow-lg` — `0 12px 28px rgba(26,24,20,0.12)`: larger floating panels and sheets.
- `--shadow-xl` — `0 24px 48px rgba(26,24,20,0.16)`: modals and dialogs only.

In dark theme the same tokens deepen to true-black alphas (e.g. `0 4px 12px rgba(0,0,0,0.36)`)
because tonal layering alone reads weakly on a near-black ground.

> **Named Rule — Shadows Are For Things That Float.** If an element is not an overlay and is not
> being hovered, it gets zero box-shadow. Elevation is earned by leaving the surface, not by
> default decoration.

## 5. Components

**Buttons — quietly confident, gently curved.** Medium weight, `select-none`, a 14px radius
(`--radius-lg`) at the default `md` size (40px tall, 16px horizontal padding); `sm` tightens to
a 10px radius, `xl` opens to an 18px radius for hero CTAs. Transitions run on the _fast_ 140ms
curve and press with `scale(0.98)` — a tap, never a bounce.

- **Primary** — Deep Olive fill, white text, `--shadow-sm` seat; the single most important action.
- **Hover / Active** — background steps to Olive Hover (`#4a5f3f`) then Olive Active (`#3a4b32`);
  no lift, no glow. **Focus-visible** shows a 2px Deep Olive outline at 2px offset (global rule).
- **Secondary** — elevated-white surface, hairline border, ink text, hover to cream-subtle.
- **Ghost** — transparent, ink text, hover to a cream-subtle bed; for low-emphasis actions.
- **Outline** — transparent with a stronger border; **Destructive** — Error red fill, white text,
  hover dims to 90% opacity; **Accent** — the rare Burnt Sienna fill, used sparingly.

**Chips — the pill switch.** 36px tall, fully pill-radius, label-sized. Unselected: elevated-white
with a hairline that strengthens on hover. **Selected: inverts to ink fill with cream text and a
transparent border** — the strongest, calmest possible "on" state, transitioning on the 140ms curve.

**Cards & Containers — flat envelopes.** 18px radius (`--radius-xl`), elevated-white surface, a
single `#e5e0d5` hairline, no resting shadow. Compound parts (`Card.Header / Body / Footer`) use
24px padding with hairline-subtle dividers. The **interactive** variant lifts on hover
(`translateY(-2px)` + `--shadow-md`) over the slow 240ms curve; the **elevated** variant opts into
`--shadow-md` only when a brief truly needs to float.

**Inputs & Fields — calm wells with an olive focus.** 44px tall, 14px radius, elevated-white,
hairline border. **Focus draws the border to Deep Olive and adds a 2px Olive-Soft ring** (`focus-within`),
on the 140ms curve — a gentle bloom, never a hard glow. Error swaps border and ring to Error red.
`Field` stacks a medium 14px label, the control, and a single helper-or-error line in subtle ink
(error text in red), so every field carries meaning in text _and_ color.

**Navigation — hairline-quiet.** Sticky headers sit on the page cream with a single bottom hairline
and an optional `.glass` blur (`color-mix` 80% elevated + 12px backdrop blur) over scrolling content
— the _only_ sanctioned blur in the system. Tabs come in underline and pill forms; the active tab is
marked by the primary, not by a box.

**Signature — Availability Calendar.** The off-hours USP made tactile. A 6-week, 7-column grid where
days with open after-close slots glow in **Olive-Soft with a small olive dot**; the selected day fills
Deep Olive; everything else recedes to subtle ink at 40% opacity. Picking a day reveals **slot chips**
(`23:00–06:00 · 7시간`) on a cream-subtle pill that warms to Olive-Soft on hover. Only the lamp-lit
nights draw the eye.

**Signature — Add-on Picker.** A quiet upsell rail. Each paid option is a hairline row at 14px radius;
**an active row washes to Olive-Soft**. A 28px circular stepper (Minus / quantity / Plus) adjusts
quantity, the live subtotal prints inline in Deep Olive, and a single Sienna `Sparkles` glyph marks the
section — the lone accent in the panel.

**Signature — Space Card Hover Carousel.** The "quiet luxury curation" surface. A 4:3 image fills an
18px-radius frame; **on hover the photos cross-fade every 1.6s** (500ms fade on the standard curve,
desktop only, static fallback on touch) with slim white progress dabs. Overlay controls (favorite,
compare) sit on a translucent scrim and scale 1.05 on hover; the favorited heart fills Burnt Sienna.
Live "오늘 22:00 가능 · −10%" sits in a Sienna-Soft pill — the off-hours promise, right on the card.

## 6. Do's and Don'ts

**Do** lead with Deep Olive (`#5a6f4f`) for every primary action, active state, and link.
**Don't** reach for a second brand hue — there is one primary and one accent, full stop.

**Do** spend Burnt Sienna (`#c97550`) like a rare ember — a live slot badge, the favorited heart,
one eyebrow label. **Don't** let the accent exceed ~5% of a screen; the moment it becomes a fill,
it stops meaning "look here."

**Do** sit everything on warm cream (`#faf8f4`) over warm ink (`#1a1814`). **Don't** use pure
`#000` or pure `#fff` for text or page backgrounds — white is reserved strictly for elevated
surfaces.

**Do** express depth with tonal layers and hairline borders (`#e5e0d5`). **Don't** put resting
shadows on cards, inputs, or chips — shadows belong only to overlays (modal/popover/toast) and to
hover lifts.

**Do** keep motion to ~240ms on `cubic-bezier(0.2,0,0,1)`, with a quiet `scale(0.98)` press.
**Don't** use bouncy, elastic, or spring overshoot motion on UI — save any spring strictly for a
tiny press feel, never for entrances.

**Do** honor `prefers-reduced-motion` and keep generous Korean whitespace on a 4px grid.
**Don't** crowd cards with stacked badges, counters, and price shouts the way legacy rental sites do.

**Do** mark focus with the 2px Deep Olive outline at 2px offset on every interactive element.
**Don't** remove focus rings or rely on color alone — errors always pair red with text.

**Do** keep the _one_ sanctioned blur for the sticky-header `.glass` only. **Don't** add decorative
glassmorphism — frosted panels as ornament are banned.

**Don't** draw side-stripe accent borders thicker than 1px — structure is hairline, never a colored bar.

**Don't** ship gradient text via `background-clip: text` as a default styling device; headlines are
solid ink or serif. (The hero's animated rotating word is the single, deliberate, scoped exception —
do not generalize it.)
