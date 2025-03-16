import type { GladeOptions, GladePlugin, GladePluginClass, GladePlugins } from './types'
import { GladeCore } from './core'
import { GladeHistory } from './history'
import { GladeWorkspace } from './workspace'

export class Glade {
  view: GladeCore

  workspace: GladeWorkspace

  history: GladeHistory

  plugins: GladePlugins<string> = new Map()

  constructor(container: string | HTMLDivElement, options: GladeOptions = {}) {
    const { workspace } = options

    this.view = new GladeCore(container)
    this.workspace = new GladeWorkspace(this.view, workspace)
    this.history = new GladeHistory(this.view, this.workspace)
  }

  use<T>(Plugin: GladePluginClass<T>, options?: T) {
    const plugin = new Plugin(this.workspace, options)
    const name = plugin.name

    if (!this.plugins.get(name)) {
      this.plugins.set(name, plugin)
    }
    else {
      console.warn(`Plugin "${plugin.name}" is already registered.`)
    }

    return this
  }

  unuse(name: string) {
    const plugin = this.plugins.get(name)

    if (plugin) {
      plugin.destroy()
      this.plugins.delete(name)
    }
    else {
      console.warn(`Plugin "${plugin}" not found.`)
    }

    return this
  }

  getPlugin<T extends GladePlugin>(name: string) {
    return this.plugins.get<T>(name)
  }

  enablePlugin(name: string) {
    const plugin = this.plugins.get(name)

    if (plugin) {
      plugin.enable()
    }
  }

  disablePlugin(name: string) {
    const plugin = this.plugins.get(name)

    if (plugin) {
      plugin.disable()
    }
  }

  destroy() {
    this.plugins.forEach(plugin => plugin.destroy())
    this.plugins.clear()
    this.workspace.removeAllListeners()
    this.view.destroy()
  }
}
