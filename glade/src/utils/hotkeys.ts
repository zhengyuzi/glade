import type { HotkeysEvent } from 'hotkeys-js'
import hotkeys from 'hotkeys-js'

export type KeyHandler = (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => void | boolean | Promise<void> | Promise<boolean>

export function hotkey(key: string, method: KeyHandler, splitKey: string = '+') {
  hotkeys(key, { splitKey }, (keyboardEvent, hotkeysEvent) => {
    keyboardEvent.preventDefault()
    method(keyboardEvent, hotkeysEvent)
  })
}

export function unhotkey(key?: string) {
  hotkeys.unbind(key)
}
