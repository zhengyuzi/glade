import type { GladePlugin, GladeWorkspace } from '@glade-app/core'

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
      this.workspace.addEventListener('pointerdown', this.handlePointerdown)
      this.workspace.container.addEventListener('contextmenu', this.handleContextmenu)
    }
  }

  disable() {
    if (this.isEnable) {
      this.isEnable = false
      this.workspace.cursor = 'default'
      this.workspace.removeEventListener('pointerdown', this.handlePointerdown)
      document.removeEventListener('pointermove', this.handlePointermove)
      document.removeEventListener('pointerup', this.handlePointerup)
      this.workspace.container.removeEventListener('contextmenu', this.handleContextmenu)
    }
  }

  private handleContextmenu = (e: any) => e.preventDefault()

  private handlePointerdown = () => {
    this.workspace.cursor = 'grabbing'
    document.addEventListener('pointermove', this.handlePointermove)
    document.addEventListener('pointerup', this.handlePointerup)
  }

  private handlePointermove = (e: any) => {
    const moveX = e.movementX
    const moveY = e.movementY

    this.workspace.position = {
      x: this.workspace.x + moveX,
      y: this.workspace.y + moveY,
    }
  }

  private handlePointerup = () => {
    this.workspace.cursor = 'grab'
    document.removeEventListener('pointermove', this.handlePointermove)
    document.removeEventListener('pointerup', this.handlePointerup)
  }
}
