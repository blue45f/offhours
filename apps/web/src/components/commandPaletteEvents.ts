export const COMMAND_PALETTE_OPEN_EVENT = 'offhours:open-command-palette'

export function openCommandPalette(): void {
  globalThis.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT))
}
