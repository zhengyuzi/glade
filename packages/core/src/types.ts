import type { Vector2d } from 'konva/lib/types'
import type {
  GladeGroup,
  GladeGroupConfig,
  GladeImage,
  GladeImageConfig,
  GladeLine,
  GladeLineConfig,
  GladeRect,
  GladeRectConfig,
  GladeText,
  GladeTextConfig,
} from './nodes'
import type { GladeWorkspace } from './workspace'

export interface GladeOptions {
  workspace?: GladeWorkspaceOptions
}

export interface GladeWorkspaceOptions {
  zoom?: number
  position?: Vector2d
  nodes?: GladeNodeObj[]
}

export type GladeNode = GladeLine | GladeRect | GladeText | GladeImage | GladeGroup

export interface GladeNodeConfig {
  GladeLine: GladeLineConfig
  GladeRect: GladeRectConfig
  GladeText: GladeTextConfig
  GladeImage: GladeImageConfig
  GladeGroup: GladeGroupConfig
}

export interface GladeNodeObj {
  attrs: {
    id: string
    [key: string]: any
  }
  className: keyof GladeNodeConfig
  children?: Array<any>
  isSelect?: boolean
  zIndex: number
}

export interface GladePlugin {
  name: string
  enable: () => void
  disable: () => void
  destroy: () => void
}

export interface GladePluginClass<T> {
  new (workspace: GladeWorkspace, options?: T): GladePlugin
}

export interface GladePlugins<TKey> {
  get: <T = TKey>(key: TKey) => (T extends TKey ? GladePlugin : T) | undefined
  set: <T = TKey>(key: T, handler: GladePlugin) => this
  delete: (key: string) => boolean
  clear: () => void
  forEach: <T = TKey>(callbackfn: (value: GladePlugin, key: T, map: this) => void, thisArg?: any) => void
}

export interface GladeEventNode {
  nodes: GladeNode[]
  type: keyof GladeEvents
}

export interface GladeEventView {
  value: {
    x: number
    y: number
    width: number
    height: number
    zoom: number
  }
  type: 'update-view'
}

export interface GladeEvents {
  'update-view': (e: GladeEventView) => void
  'node:add': (e: GladeEventNode) => void
  'node:remove': (e: GladeEventNode) => void
  'node:transformstart': (e: GladeEventNode) => void
  'node:transform': (e: GladeEventNode) => void
  'node:transformend': (e: GladeEventNode) => void
  'node:movestart': (e: GladeEventNode) => void
  'node:move': (e: GladeEventNode) => void
  'node:moveend': (e: GladeEventNode) => void
  'node:select': (e: GladeEventNode) => void
  'node:cancel-select': (e: GladeEventNode) => void
  'node:send-backward': (e: GladeEventNode) => void
  'node:send-to-back': (e: GladeEventNode) => void
  'node:bring-forward': (e: GladeEventNode) => void
  'node:bring-to-front': (e: GladeEventNode) => void
  'node:object': (e: GladeEventNode) => void
  'node:load': (e: GladeEventNode) => void
}

export interface GladeHistoryHook {
  change: () => void
}

export interface GladeHistoryItem {
  type: keyof GladeEvents
  nodes: GladeNodeObj[]
  timestamp: number
}
