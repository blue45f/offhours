export const COMMAND_PALETTE_OPEN_EVENT = 'offhours:open-command-palette'

export function openCommandPalette(): void {
  window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT))
}
