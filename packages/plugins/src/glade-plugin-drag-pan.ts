import type { GladePlugin, GladeWorkspace } from '@glade/core'

export interface GladePluginDragPanOptions {
  enable?: boolean
}

export class GladePluginDragPan implements GladePlugin {
  name = 'glade-plugin-drag-pan'

  isEnable = false

  constructor(public workspace: GladeWorkspace, options: GladePluginDragPanOptions = {}) {
    const { enable = false } = options
    enable && this.enable()
  }

  destroy() {
    this.disable()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.workspace.cursor = 'grab'
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

  private handleMousedown = () => {
    this.workspace.cursor = 'grabbing'
    document.addEventListener('mousemove', this.handleMousemove)
    document.addEventListener('mouseup', this.handleMouseup)
  }

  private handleMousemove = (e: any) => {
    const moveX = e.movementX
    const moveY = e.movementY

    this.workspace.position = {
      x: this.workspace.x + moveX,
      y: this.workspace.y + moveY,
    }
  }

  private handleMouseup = () => {
    this.workspace.cursor = 'grab'
    document.removeEventListener('mousemove', this.handleMousemove)
    document.removeEventListener('mouseup', this.handleMouseup)
  }
}
