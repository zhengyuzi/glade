import type { VNodeChild } from 'vue'

export interface ITool {
  name: string
  iconName: string
  enable: () => void
  disable: () => void
  tab?: () => VNodeChild
}

export type IContextMenu = {
  type: 'item'
  text: string
  hotkey: string
  fn: () => void
  style?: string
  show?: () => boolean
} | {
  type: 'separator'
  show?: () => boolean
}

export interface ISelect {
  label: string
  value: string
}
