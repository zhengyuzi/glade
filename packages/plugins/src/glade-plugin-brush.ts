import type { GladeLine, GladePlugin, GladeWorkspace } from '@glade/core'

export interface GladePluginBrushOptions {
  enable?: boolean
}

export class GladePluginBrush implements GladePlugin {
  name = 'glade-plugin-brush'

  isEnable = false

  private currentLine?: GladeLine

  private prevPosition?: {
    x: number
    y: number
  } | null

  constructor(public workspace: GladeWorkspace, options: GladePluginBrushOptions = {}) {
    const { enable = false } = options
    enable && this.enable()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.workspace.cursor = 'crosshair'
      this.workspace.onEvent('mousedown', this.handleMousedown)
      this.workspace.container.addEventListener('contextmenu', this.handleContextmenu)
    }
  }

  disable() {
    if (this.isEnable) {
      this.isEnable = false
      this.workspace.cursor = 'default'
      this.workspace.offEvent('mousedown', this.handleMousedown)
      document.removeEventListener('mousemove', this.handleMousemove)
      document.removeEventListener('mouseup', this.handleMouseup)
      this.workspace.container.removeEventListener('contextmenu', this.handleContextmenu)
    }
  }

  private handleContextmenu = (e: any) => e.preventDefault()

  private handleMousedown = (e: any) => {
    if (e.evt.button !== 0) {
      return
    }

    this.prevPosition = this.workspace.pointerPosition

    if (this.prevPosition) {
      this.currentLine = this.workspace.createNode('GladeLine', {
        lineType: 'smooth',
        strokeWidth: 8,
        stroke: '#000',
        points: [this.prevPosition.x, this.prevPosition.y],
      })

      this.workspace.addNode(this.currentLine)

      document.addEventListener('mousemove', this.handleMousemove)
      document.addEventListener('mouseup', this.handleMouseup)
    }
  }

  private handleMousemove = (e: any) => {
    if (!this.currentLine || !this.prevPosition) {
      return
    }

    const point = {
      x: (e.x - this.workspace.x) / this.workspace.zoom,
      y: (e.y - this.workspace.y) / this.workspace.zoom,
    }

    this.currentLine.points([...this.currentLine.points(), point.x, point.y])

    this.prevPosition = point
  }

  private handleMouseup = () => {
    this.currentLine = undefined
    document.removeEventListener('mousemove', this.handleMousemove)
    document.removeEventListener('mouseup', this.handleMouseup)
  }

  destroy() {
    this.disable()
  }
}
