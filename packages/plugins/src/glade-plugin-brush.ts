import type { GladeHookEvent, GladeLine, GladeNode, GladePlugin, GladeWorkspace } from '@glade/core'
import { smooth } from '@glade/brush'

export type GladeBrushType = 'default'

export interface GladePluginBrushConfig {
  /**
   * Brush stroke type
   */
  brushType?: GladeBrushType

  /**
   * Brush stroke color
   */
  strokeColor?: string

  /**
   * Brush stroke width
   */
  strokeWidth?: number

  /**
   * Brush stroke opacity
   */
  strokeOpacity?: number
}

export interface GladePluginBrushOptions extends GladePluginBrushConfig {
  enable?: boolean
}

export class GladePluginBrush implements GladePlugin {
  name = 'glade-plugin-brush'

  isEnable = false

  private _brushType: GladeBrushType

  private _strokeColor: string

  private _strokeWidth: number

  private _strokeOpacity: number

  private currentLine?: GladeLine

  private lastPosition?: {
    x: number
    y: number
  }

  static brushes = {
    default: smooth,
  }

  constructor(public workspace: GladeWorkspace, options: GladePluginBrushOptions = {}) {
    const {
      enable = false,
      brushType = 'default',
      strokeColor = '#000000',
      strokeWidth = 8,
      strokeOpacity = 1,
    } = options

    this._brushType = brushType
    this._strokeColor = strokeColor
    this._strokeWidth = strokeWidth
    this._strokeOpacity = strokeOpacity

    workspace.nodes.forEach(this.handleBrush)

    enable && this.enable()

    this.workspace.on('node:load', this.handleNodeLoad)
  }

  config(_config?: GladePluginBrushConfig) {
    if (_config) {
      const { brushType, strokeColor, strokeWidth, strokeOpacity } = _config

      brushType && (this._brushType = brushType)
      strokeColor && (this._strokeColor = strokeColor)
      strokeWidth && (this._strokeWidth = strokeWidth)
      strokeOpacity && (this._strokeOpacity = strokeOpacity)
    }

    return {
      brushType: this._brushType,
      strokeWidth: this._strokeWidth,
      strokeColor: this._strokeColor,
      strokeOpacity: this._strokeOpacity,
    }
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.workspace.cursor = 'crosshair'
      this.workspace.addEventListener('pointerdown', this.handlePointerdown)
      this.workspace.container.addEventListener('contextmenu', this.handleContextmenu)
    }
  }

  disable() {
    if (this.isEnable) {
      this.workspace.cursor = 'default'
      this.workspace.removeEventListener('pointerdown', this.handlePointerdown)
      this.workspace.container.removeEventListener('contextmenu', this.handleContextmenu)
      this.isEnable = false
    }
  }

  destroy() {
    this.workspace.off('node:load', this.handleNodeLoad)
    this.disable()
  }

  private handleBrush(node: GladeNode) {
    if (node.className === 'GladeLine') {
      const type = node.getAttr('brushType') as keyof typeof GladePluginBrush.brushes
      node.setAttrs({ sceneFunc: GladePluginBrush.brushes[type || 'default'].sceneFunc })
    }
  }

  private handleNodeLoad = (e: GladeHookEvent) => e.nodes.forEach(this.handleBrush)

  private handlePointerdown = (e: any) => {
    if (e.evt.button !== 0)
      return

    this.lastPosition = this.workspace.pointerPosition || undefined

    if (!this.lastPosition)
      return

    this.currentLine = this.workspace.createNode('GladeLine', {
      brushType: this._brushType,
      strokeWidth: this._strokeWidth,
      stroke: this._strokeColor,
      opacity: this._strokeOpacity,
      points: [this.lastPosition.x, this.lastPosition.y],
      sceneFunc: GladePluginBrush.brushes[this._brushType].sceneFunc,
    })

    this.workspace.addNode(this.currentLine)

    document.addEventListener('pointermove', this.handlePointermove)
    document.addEventListener('pointerup', this.handlePointerup)
  }

  private handlePointermove = (e: any) => {
    if (!this.currentLine || !this.lastPosition) {
      return
    }

    const point = {
      x: (e.x - this.workspace.x) / this.workspace.zoom,
      y: (e.y - this.workspace.y) / this.workspace.zoom,
    }

    this.currentLine.points([...this.currentLine.points(), point.x, point.y])

    this.lastPosition = point
  }

  private handlePointerup = () => {
    this.currentLine = undefined
    document.removeEventListener('pointermove', this.handlePointermove)
    document.removeEventListener('pointerup', this.handlePointerup)
  }

  private handleContextmenu = (e: any) => e.preventDefault()
}
