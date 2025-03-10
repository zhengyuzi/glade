import type { VNodeChild } from 'vue'

export interface ITool {
  name: string
  iconName: string
  enable: () => void
  disable: () => void
}

export type IContextMenu = {
  type: 'item'
  text: string
  hotkey: string
  fn: () => void
  style?: string
} | {
  type: 'separator'
}

export interface IToggleGroup {
  value: string
  content: () => VNodeChild
}
