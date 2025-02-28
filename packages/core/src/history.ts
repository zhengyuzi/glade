import type { GladeEventNode, GladeHistoryHook, GladeHistoryItem, GladeNodeObj } from './types'
import type { GladeWorkspace } from './workspace'
import EventEmitter from 'eventemitter3'

export class GladeHistory extends EventEmitter<GladeHistoryHook> {
  historys: GladeHistoryItem[] = []

  defaultNodes: GladeNodeObj[]

  currentIndex = -1

  maxLength = 50

  constructor(public workspace: GladeWorkspace) {
    super()

    this.defaultNodes = workspace.objectNode(workspace.getAllNode())

    workspace.on('node:add', this.handleEvent)
    workspace.on('node:remove', this.handleEvent)
    workspace.on('node:moveend', this.handleEvent)
    workspace.on('node:transformend', this.handleEvent)
    workspace.on('node:select', this.handleEvent)
    workspace.on('node:cancel-select', this.handleEvent)
    workspace.on('node:send-backward', this.handleEvent)
    workspace.on('node:send-to-back', this.handleEvent)
    workspace.on('node:bring-forward', this.handleEvent)
    workspace.on('node:bring-to-front', this.handleEvent)
  }

  get isUndoable() {
    return !!this.historys.length && this.currentIndex >= 0
  }

  get isRedoable() {
    return !!this.historys.length && this.currentIndex < this.historys.length - 1
  }

  get handle() {
    const { type, nodes } = this.historys[this.currentIndex]

    const handles = {
      'node:add': {
        undo: () => {
          const _nodes = this.workspace.getNodes(nodes, item => item.attrs.id)
          const preservedNodes = this.workspace.selectedNodes.filter(node => !_nodes.includes(node))
          _nodes.forEach(node => node.remove())
          this.workspace._tr.nodes(preservedNodes)
        },
        redo: () => {
          const _nodes = this.workspace.loadNode(nodes)
          this.workspace._layer.add(..._nodes)
        },
      },
      'node:remove': {
        undo: () => {
          const _nodes = this.workspace.loadNode(nodes)
          this.workspace._layer.add(..._nodes)
          this.workspace._tr.nodes(_nodes)
        },
        redo: () => {
          const _nodes = this.workspace.getNodes(nodes, item => item.attrs.id)
          const preservedNodes = this.workspace.selectedNodes.filter(node => !_nodes.includes(node))
          _nodes.forEach(node => node.remove())
          this.workspace._tr.nodes(preservedNodes)
        },
      },
      'node:select': {
        undo: () => {
          const lastNodes = this.historys[this.currentIndex - 1]

          if (lastNodes?.type === 'node:select') {
            const _lastNodes = this.workspace.getNodes(lastNodes.nodes, item => item.attrs.id)
            this.workspace._tr.nodes(_lastNodes)
          }
          else {
            const _nodes = this.workspace.getNodes(nodes, item => item.attrs.id)
            const preservedNodes = this.workspace.selectedNodes.filter(node => !_nodes.includes(node))
            this.workspace._tr.nodes(preservedNodes)
          }
        },
        redo: () => {
          const _nodes = this.workspace.getNodes(nodes, item => item.attrs.id)
          this.workspace._tr.nodes(_nodes)
        },
      },
      'node:cancel-select': {
        undo: () => {
          const _nodes = this.workspace.getNodes(nodes, item => item.attrs.id)
          this.workspace._tr.nodes(_nodes)
        },
        redo: () => {
          this.workspace._tr.nodes([])
        },
      },
    }

    const defaultHandle = {
      undo: () => {
        const lastNodes = this.historys[this.currentIndex - 1]
        this.updateNodes(lastNodes?.nodes || this.defaultNodes)
      },
      redo: () => this.updateNodes(nodes),
    }

    return handles[type as keyof typeof handles] || defaultHandle
  }

  private handleEvent = (e: GladeEventNode) => {
    // Cut `history` to current index.
    if (this.currentIndex !== this.historys.length - 1) {
      this.historys = this.historys.slice(0, this.currentIndex + 1)
    }

    const nodes = this.workspace.objectNode(e.nodes)

    // In addition to removing the node, there is no need to save the dataURL attribute of GladeImage in the history record.
    if (e.type !== 'node:remove') {
      nodes.forEach((item, index) => {
        if (item.className === 'GladeImage' && item.attrs.dataURL) {
          delete nodes[index].attrs.dataURL
        }
      })
    }

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

    this.emit('change')
  }

  undo() {
    if (!this.isUndoable) {
      return
    }

    this.handle.undo()

    this.currentIndex -= 1

    this.emit('change')
  }

  redo() {
    if (!this.isRedoable) {
      return
    }

    this.currentIndex += 1

    this.handle.redo()

    this.emit('change')
  }

  // Update node attrs/zIndex
  private updateNodes(nodes: GladeNodeObj[]) {
    nodes.forEach((_node) => {
      const { id, rotation, scaleX, scaleY, skewX, skewY, x, y } = _node.attrs
      const node = this.workspace.getNode(id)
      node?.setAttrs({ rotation, scaleX, scaleY, skewX, skewY, x, y })
      node?.setZIndex(_node.zIndex)
    })
  }

  claer() {
    this.historys = []
    this.currentIndex = -1
  }
}
