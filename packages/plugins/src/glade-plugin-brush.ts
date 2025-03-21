import type { GladeHookEvent, GladeLine, GladeNode, GladePlugin, GladeWorkspace } from '@glade-app/core'
import { smooth } from '@glade-app/brush'

export type GladeBrushType = 'default'

export interface GladePluginBrushConfig {
  /**
   * Brush stroke type
   */
  brushType?: GladeBrushType

  /**
   * Brush stroke color
   */
  stroke?: string

  /**
   * Brush stroke width
   */
  strokeWidth?: number

  /**
   * Brush stroke opacity
   */
  opacity?: number
}

export interface GladePluginBrushOptions {
  enable?: boolean
  config?: GladePluginBrushConfig
}

export const brushes = {
  default: smooth,
}

export class GladePluginBrush implements GladePlugin {
  name = 'glade-plugin-brush'

  isEnable = false

  private _config: Required<GladePluginBrushConfig> = {
    brushType: 'default',
    stroke: '#000000',
    strokeWidth: 8,
    opacity: 1,
  }

  private currentLine?: GladeLine

  private lastPosition?: {
    x: number
    y: number
  }

  constructor(public workspace: GladeWorkspace, options: GladePluginBrushOptions = {}) {
    const { enable = false, config } = options

    config && (this._config = { ...this._config, ...config })

    workspace.nodes.forEach(this.handleBrush)

    enable && this.enable()

    this.workspace.on('node:load', this.handleNodeLoad)
  }

  config(config?: GladePluginBrushConfig) {
    if (config) {
      this._config = { ...this._config, ...config }
    }
    return this._config
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

  private handleBrush = (node: GladeNode) => {
    const flatNodes = this.workspace.getFlattenedNodes([node])

    flatNodes.forEach((node) => {
      if (node.className === 'GladeLine') {
        const type = node.getAttr('brushType') as keyof typeof brushes
        node.setAttrs({ sceneFunc: brushes[type || 'default'].sceneFunc })
      }
    })
  }

  private handleNodeLoad = (e: GladeHookEvent) => e.nodes.forEach(this.handleBrush)

  private handlePointerdown = (e: any) => {
    if (e.evt.button !== 0)
      return

    this.lastPosition = this.workspace.pointerPosition || undefined

    if (!this.lastPosition)
      return

    const { brushType, strokeWidth, stroke, opacity } = this._config

    this.currentLine = this.workspace.createNode('GladeLine', {
      brushType,
      strokeWidth,
      stroke,
      opacity,
      points: [this.lastPosition.x, this.lastPosition.y],
      sceneFunc: brushes[brushType].sceneFunc,
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
