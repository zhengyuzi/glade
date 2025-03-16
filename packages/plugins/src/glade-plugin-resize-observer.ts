import type { GladePlugin, GladeWorkspace } from '@glade-app/core'
import { throttle } from 'es-toolkit'

export interface GladePluginResizeObserverOptions {
  enable?: boolean
}

export class GladePluginResizeObserver implements GladePlugin {
  name = 'glade-plugin-resize-observer'

  isEnable = false

  resizeObserver: ResizeObserver

  constructor(public workspace: GladeWorkspace, options: GladePluginResizeObserverOptions = {}) {
    const { enable = false } = options

    this.resizeObserver = new ResizeObserver(throttle((entries) => {
      const size = entries[0].contentRect
      workspace.size = size
    }, 80))

    enable && this.enable()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.resizeObserver.observe(this.workspace.container)
    }
  }

  disable() {
    if (this.isEnable) {
      this.isEnable = false
      this.resizeObserver.unobserve(this.workspace.container)
    }
  }

  destroy() {
    this.resizeObserver.disconnect()
    this.disable()
  }
}
