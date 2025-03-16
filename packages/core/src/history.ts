import type { GladeCore } from './core'
import type { GladeHistoryItem, GladeHookEvent, GladeNode, GladeNodeObj } from './types'
import type { GladeWorkspace } from './workspace'

export class GladeHistory {
  historys: GladeHistoryItem[] = []

  defaultNodes: GladeNodeObj[]

  currentIndex = -1

  maxLength = 50

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
  }

  get isUndo() {
    return !!this.historys.length && this.currentIndex >= 0
  }

  get isRedo() {
    return !!this.historys.length && this.currentIndex < this.historys.length - 1
  }

  get handle() {
    const { type, nodes } = this.historys[this.currentIndex]

    const handles = {
      'node:add': {
        undo: () => {
          const selectedNodes = this.view.transformer.nodes()
          const _nodes = this.getNodes(nodes, item => item.attrs.id)
          const preservedNodes = selectedNodes.filter(node => !_nodes.includes(node))
          this.view.canvas.removeGladeNode(..._nodes)
          this.view.transformer.nodes(preservedNodes)
          return _nodes
        },
        redo: () => {
          const _nodes = this.workspace.loadNode(nodes)
          this.view.canvas.addGladeNode(..._nodes)
          return _nodes
        },
      },
      'node:remove': {
        undo: () => {
          const _nodes = this.workspace.loadNode(nodes)
          this.view.canvas.addGladeNode(..._nodes)
          return _nodes
        },
        redo: () => {
          const selectedNodes = this.view.transformer.nodes()
          const _nodes = this.getNodes(nodes, item => item.attrs.id)
          const preservedNodes = selectedNodes.filter(node => !_nodes.includes(node))
          this.view.canvas.removeGladeNode(..._nodes)
          this.view.transformer.nodes(preservedNodes)
          return _nodes
        },
      },
      'node:select': {
        undo: () => {
          const lastNodes = this.historys[this.currentIndex - 1]

          if (lastNodes?.type === 'node:select') {
            const _lastNodes = this.getNodes(lastNodes.nodes, item => item.attrs.id)
            this.view.transformer.nodes(_lastNodes)
            return _lastNodes
          }
          else {
            const selectedNodes = this.view.transformer.nodes()
            const _nodes = this.getNodes(nodes, item => item.attrs.id)
            const preservedNodes = selectedNodes.filter(node => !_nodes.includes(node))
            this.view.transformer.nodes(preservedNodes)
            return preservedNodes
          }
        },
        redo: () => {
          const _nodes = this.getNodes(nodes, item => item.attrs.id)
          this.view.transformer.nodes(_nodes)
          return _nodes
        },
      },
      'node:cancel-select': {
        undo: () => {
          const _nodes = this.getNodes(nodes, item => item.attrs.id)
          this.view.transformer.nodes(_nodes)
          return _nodes
        },
        redo: () => {
          this.view.transformer.nodes([])
          return []
        },
      },
    }

    const defaultHandle = {
      undo: () => {
        const lastNodes = this.historys[this.currentIndex - 1]
        return this.updateNodes(lastNodes?.nodes || this.defaultNodes)
      },
      redo: () => this.updateNodes(nodes),
    }

    return handles[type as keyof typeof handles] || defaultHandle
  }

  private handleEvent = (e: GladeHookEvent) => {
    // Cut `history` to current index.
    if (this.currentIndex !== this.historys.length - 1) {
      this.historys = this.historys.slice(0, this.currentIndex + 1)
    }

    const nodes = this.workspace.objectNode(
      e.nodes,
      { dataURL: e.type === 'node:add' || e.type === 'node:remove' },
    )

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

    const nodes = this.handle.undo()

    this.currentIndex -= 1

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

    const nodes = this.handle.redo()

    this.workspace.emit('history:redo', {
      type: 'history:redo',
      nodes,
    })
  }

  // Update node attrs/zIndex
  private updateNodes = (nodes: GladeNodeObj[]) => nodes.reduce<GladeNode[]>((pre, item) => {
    // Some attrs aren't tracked unless modified, redo/undo won't modify them.
    const defaultAttrs = {
      opacity: 1,
    }

    const { id, rotation, scaleX, scaleY, skewX, skewY, x, y, ...attrs } = item.attrs

    const node = this.workspace.getNode(id)

    node?.setAttrs({ rotation, scaleX, scaleY, skewX, skewY, x, y, ...defaultAttrs, ...attrs })
    node?.setZIndex(item.zIndex)

    node && pre.push(node)

    return pre
  }, [])

  private getNodes<T>(arr: T[], callback?: (item: T) => string) {
    const nodes: GladeNode[] = []

    arr.forEach((item) => {
      const id = callback?.(item) || item

      if (typeof id === 'string') {
        const node = this.workspace.getNode(id)
        node && nodes.push(node)
      }
    })

    return nodes
  }

  claer() {
    this.historys = []
    this.currentIndex = -1
  }
}
