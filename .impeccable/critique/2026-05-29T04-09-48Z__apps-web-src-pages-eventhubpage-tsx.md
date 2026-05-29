---
target: 모임 허브 (Event Hub) — EventHubPage.tsx
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-05-29T04-09-48Z
slug: apps-web-src-pages-eventhubpage-tsx
---

## Design Health Score — 모임 허브 (Event Hub)

| #         | Heuristic                      | Score     | Key Issue                                                                                                           |
| --------- | ------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status    | 3         | Live countdown + skeleton + toast are strong; RSVP submit shows only disabled/opacity, no inline "저장 중"          |
| 2         | Match System / Real World      | 3         | Invitation metaphor + natural Korean dates excellent, but a COMPLETED past event still reads "지금 모이는 중이에요" |
| 3         | User Control & Freedom         | 3         | Can change RSVP (변경); cannot withdraw a response (only switch to 불참)                                            |
| 4         | Consistency & Standards        | 4         | Disciplined token use, reuses Avatar/Input/Skeleton, consistent radii/spacing                                       |
| 5         | Error Prevention               | 3         | Name-required guard is good, but choosing a status with an empty name highlights it yet silently blocks submit      |
| 6         | Recognition Rather Than Recall | 4         | Everything visible: who's coming, saved name prefilled, status by label+icon                                        |
| 7         | Flexibility & Efficiency       | 3         | No "add to calendar" and no re-share affordance on an invitation surface                                            |
| 8         | Aesthetic & Minimalist         | 4         | Editorial hero, restrained palette, generous rhythm, status chips (code-based read)                                 |
| 9         | Error Recovery                 | 3         | Not-found view is graceful + actionable; network RSVP error is a toast with no retry                                |
| 10        | Help & Documentation           | 3         | Address-privacy note orients well; otherwise self-explanatory by design                                             |
| **Total** |                                | **33/40** | **Strong — ship-ready with targeted polish**                                                                        |

> Confidence caveat: scores are from source review only. Visual/aesthetic heuristics (#8) and rendered-state checks lacked browser confirmation this run.

## Anti-Patterns Verdict

**Does this look AI-generated? No.** This is the opposite of slop. The page commits to a real idea ("디지털 초대장"): a full-bleed photo hero with a warm OKLCH scrim (not pure black), a serif display title, a live countdown, and a calm definition-list for logistics. It avoids every cross-register ban inside the hub: no side-stripe borders, no gradient text, no decorative glass, no hero-metric template, no identical-card grid. Status is conveyed by color + shape + icon + sr-only text, not color alone. Copy is warm and specific.

**Deterministic scan**: Unavailable this run (bundled `detect.mjs` entrypoint not found). Per critique rules this is an allowed skip, not a failed run.

**Visual overlays**: Unavailable. Chrome profile is locked and :3000/:5173 are held by the user's other projects (PromptMarket / rotifolk), so no `[Human]` overlay was injected. Fallback: source-based review only.

**Cross-surface flag (outside the hub):** the **home hero uses gradient text** (`background-clip: text` + `#d97757`), a documented absolute-ban. Real design debt on the landing surface, worth a separate `polish`.

## Overall Impression

The hub is the emotional payoff the marketplace was missing: it turns a booking into something you'd want to forward to friends. Hierarchy, restraint, and accessibility are genuinely good. The biggest opportunity is functional, not visual: an event invitation that can't add-to-calendar and mishandles past events is missing table-stakes "evite" behavior. Close those and it's excellent.

## What's Working

1. **The hero earns the "invitation" claim.** Photo + warm tonal scrim + serif title + "(host)님이 초대합니다" + live countdown reads like a tasteful invite, not a receipt. The OKLCH gradient fallback for missing photos avoids a dead gray box.
2. **Accessibility is real, not decorative.** RSVP is a labelled `role=group` with `aria-pressed`, name field wires `aria-describedby` to its error, status uses label+icon+shape+sr-only (never color alone), `aria-live="polite"` on the countdown, reduced-motion respected.
3. **Privacy is designed in.** The public page shows region+district only and explicitly says the exact address is revealed to attendees after host confirmation. Correct instinct for a link anyone can open.

## Priority Issues

- **[P2] Past/ended events read "지금 모이는 중이에요."** The countdown maps any past `startAt` to "happening now," so a COMPLETED event that ended days ago still says it's in progress.
  - **Why it matters**: factually wrong at a high-trust moment; makes a finished gathering look live.
  - **Fix**: branch on `endAt`. Before start → countdown; between start/end → "지금 모이는 중"; after end → "이미 끝난 모임이에요" (and drop the countdown pill).
  - **Suggested command**: `clarify`

- **[P2] No "add to calendar."** The single most expected action on an invite after RSVP is absent.
  - **Why it matters**: guests forget; the host's fill-rate goal depends on people actually showing up.
  - **Fix**: add an ICS download + Google Calendar link in the hero or logistics block.
  - **Suggested command**: `craft`

- **[P3] No re-share from the hub.** Only the host's reservation-detail page can share; a guest who wants to forward the invite has no affordance here.
  - **Why it matters**: viral group invites are the whole point of a shareable link.
  - **Fix**: a quiet "초대 링크 복사" in the hero or footer.
  - **Suggested command**: `delight`

- **[P3] "미정" outweighs "참석" visually.** The selected MAYBE chip uses a near-black `--color-fg` fill while GOING uses primary olive; the heaviest chip is the least committal status.
  - **Why it matters**: visual weight should track desirability; GOING should dominate.
  - **Fix**: give GOING the strongest fill, MAYBE a lighter tonal treatment.
  - **Suggested command**: `colorize`

- **[P3] RSVP identity matches by name, not token.** `myRsvp` is found by `r.name === savedName`; two guests named "민호" collide, and the saved device token isn't used to resolve "my" response.
  - **Why it matters**: wrong "you responded" state for common names.
  - **Fix**: return a stable per-device marker or resolve "mine" via the clientToken server-side.
  - **Suggested command**: `harden`

## Persona Red Flags

**Jordan (invited first-timer, opens the link cold, no login)**: Can RSVP in two taps, name prefilled on return. Red flags: no add-to-calendar so they rely on memory; if the event already ended they see a confusing "지금 모이는 중"; picking a status before typing a name highlights the button but nothing happens until they notice the inline error and re-tap.

**현우 (회식 총무, project persona, wrangling 30 people)**: The tally (참석 N · 미정 N · 불참 N) and chip list give a fast read. Red flags: no way to nudge non-responders, no calendar export to push to the group, and a duplicate common name would misreport "내 응답."

## Minor Observations

- Pending RSVP state is disabled + opacity only; an inline "저장 중" or spinner would tighten status feedback.
- After choosing a status with an empty name, the choice stays highlighted but submission needs a second tap once the name is entered; auto-submit on name-blur-with-choice would smooth this.
- `text-meta` utility is used in the hero; couldn't browser-confirm it resolves (verify it exists in the type scale).
- Countdown ticks per second via `useCountdown`; fine, but seconds only matter in the final hour, so a coarser cadence past D-1 would cut needless re-renders.

## Questions to Consider

- What if the page led with a single confident primary action (RSVP) and folded logistics below, instead of giving logistics the first elevated card?
- Should a finished event transform into a gentle "다녀온 모임" recap (photos, thanks) rather than just stopping the countdown?
- Does an anonymous link-opener need the host's name in the hero, or is that a privacy surface worth a second look?
