import type { Group } from 'konva/lib/Group'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { Shape, ShapeConfig } from 'konva/lib/Shape'
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

export type GladeNodeBaseType = Group | Shape<ShapeConfig>

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
  children?: GladeNodeObj[]
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

export interface GladeOnEventOptions {
  /**
   * Only listen to the nodes on the canvas
   */
  onlyNode?: boolean
}

export interface GladeAddNodeOptions {
  layer?: 'canvas' | 'background' | 'foreground'
  select?: boolean
}

export interface GladeEventObject<EventType, Node> extends Omit<KonvaEventObject<EventType, Node>, 'target'> {
  target: GladeNode
}

export interface GladeHookEvent {
  nodes: GladeNode[]
  type: keyof GladeHooks
}

export interface GladeHooks {
  'view:update': () => void
  'node:add': (e: GladeHookEvent) => void
  'node:remove': (e: GladeHookEvent) => void
  'node:transformstart': (e: GladeHookEvent) => void
  'node:transform': (e: GladeHookEvent) => void
  'node:transformend': (e: GladeHookEvent) => void
  'node:movestart': (e: GladeHookEvent) => void
  'node:move': (e: GladeHookEvent) => void
  'node:moveend': (e: GladeHookEvent) => void
  'node:select': (e: GladeHookEvent) => void
  'node:cancel-select': (e: GladeHookEvent) => void
  'node:backward': (e: GladeHookEvent) => void
  'node:to-back': (e: GladeHookEvent) => void
  'node:forward': (e: GladeHookEvent) => void
  'node:to-front': (e: GladeHookEvent) => void
  'node:group': (e: GladeHookEvent) => void
  'node:ungroup': (e: GladeHookEvent) => void
  'node:update': (e: GladeHookEvent) => void
  'node:object': (e: GladeHookEvent) => void
  'node:load': (e: GladeHookEvent) => void
  'history:change': (e: GladeHistoryItem) => void
  'history:undo': (e: GladeHookEvent) => void
  'history:redo': (e: GladeHookEvent) => void
}

export interface GladeHistoryItem {
  type: keyof GladeHooks
  nodes: GladeNodeObj[]
  timestamp: number
}

export interface GladeOptions {
  workspace?: GladeWorkspaceOptions
}

export interface GladeWorkspaceOptions {
  zoom?: number
  position?: Vector2d
  nodes?: GladeNodeObj[]
}

export interface GladeObjectNodeOptions {
  /**
   * Export the dataURL of the image
   */
  dataURL?: boolean
}
