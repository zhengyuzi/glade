import type { GladeCore } from './core'
import type { GladeHistoryItem, GladeHookEvent, GladeNodeObj } from './types'
import type { GladeWorkspace } from './workspace'

export class GladeHistory {
  historys: GladeHistoryItem[] = []

  defaultNodes: GladeNodeObj[] = []

  currentIndex = -1

  maxLength = 20

  constructor(private view: GladeCore, private workspace: GladeWorkspace) {
    this.defaultNodes = workspace.objectNode(workspace.nodes)

    workspace.on('node:add', this.handleEvent)
    workspace.on('node:remove', this.handleEvent)
    workspace.on('node:moveend', this.handleEvent)
    workspace.on('node:transformend', this.handleEvent)
    workspace.on('node:select', this.handleEvent)
    workspace.on('node:cancel-select', this.handleEvent)
    workspace.on('node:backward', this.handleEvent)
    workspace.on('node:to-back', this.handleEvent)
    workspace.on('node:forward', this.handleEvent)
    workspace.on('node:to-front', this.handleEvent)
    workspace.on('node:update', this.handleEvent)
    workspace.on('node:group', this.handleEvent)
    workspace.on('node:ungroup', this.handleEvent)
  }

  get isUndo() {
    return !!this.historys.length && this.currentIndex >= 0
  }

  get isRedo() {
    return !!this.historys.length && this.currentIndex < this.historys.length - 1
  }

  private handleEvent = async (e: GladeHookEvent) => {
    await new Promise(resolve => setTimeout(resolve, 50))

    // Cut `history` to current index.
    if (this.currentIndex !== this.historys.length - 1) {
      this.historys = this.historys.slice(0, this.currentIndex + 1)
    }

    const nodes = this.workspace.objectNode(this.workspace.nodes)

    const history: GladeHistoryItem = {
      type: e.type,
      nodes,
      timestamp: Date.now(),
    }

    this.historys.push(history)

    if (this.historys.length > this.maxLength) {
      this.historys.shift()
    }

    this.currentIndex = this.historys.length - 1

    this.workspace.emit('history:change', history)
  }

  undo() {
    if (!this.isUndo) {
      return
    }

    this.currentIndex -= 1

    const history = this.historys[this.currentIndex]

    this.view.canvas.clearGladeNode()

    const nodes = this.workspace.loadNode(history?.nodes || this.defaultNodes)

    this.view.canvas.addGladeNode(...nodes)

    this.workspace.emit('history:undo', {
      type: 'history:undo',
      nodes,
    })
  }

  redo() {
    if (!this.isRedo) {
      return
    }

    this.currentIndex += 1

    const history = this.historys[this.currentIndex]

    this.view.canvas.clearGladeNode()

    const nodes = this.workspace.loadNode(history.nodes)

    this.view.canvas.addGladeNode(...nodes)

    this.workspace.emit('history:redo', {
      type: 'history:redo',
      nodes,
    })
  }

  claer() {
    this.historys = []
    this.currentIndex = -1
  }
}
