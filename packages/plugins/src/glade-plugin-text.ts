import type { GladePlugin, GladeWorkspace } from '@glade/core'

export interface GladePluginTextOptions {
  enable?: boolean
}

export class GladePluginText implements GladePlugin {
  name = 'glade-plugin-text'

  isEnable = false

  constructor(public workspace: GladeWorkspace, options: GladePluginTextOptions = {}) {
    const { enable = false } = options
    enable && this.enable()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
    }
  }

  disable() {
    if (this.isEnable) {
      this.isEnable = false
    }
  }

  destroy() {
    this.disable()
  }
}
