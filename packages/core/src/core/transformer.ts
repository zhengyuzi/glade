import type { Node, NodeConfig } from 'konva/lib/Node'
import type { GladeNode, GladeNodeBaseType } from '../types'
import Konva from 'konva'

export class GladeTransformer {
  _node: Transformer

  private _nodes: GladeNode[] = []

  constructor(config?: Konva.TransformerConfig) {
    this._node = new Transformer(config)
  }

  nodes(_nodes?: GladeNode[]) {
    if (!_nodes) {
      return this._nodes
    }

    this._node.nodes(_nodes.map(item => item._node))

    this._nodes = [..._nodes]

    return this._nodes
  }

  isTransformerNode(node: GladeNodeBaseType) {
    return node === this._node || node?.parent === this._node || node === this._node.mask
  }
}

class Transformer extends Konva.Transformer {
  // Transformer mask
  mask: Konva.Rect

  constructor(config?: Konva.TransformerConfig) {
    super(config)

    this.mask = new Konva.Rect({
      fill: config?.fill,
      draggable: true,
    })

    super._proxyDrag(this.mask)
  }

  _setAttr(key: any, val: any) {
    super._setAttr(key, val)

    if (key === 'x' || key === 'y' || key === 'rotation') {
      this.mask.setAttrs({
        x: this.x(),
        y: this.y(),
        width: this.width(),
        height: this.height(),
        rotation: this.rotation(),
      })
    }
    else if (key === 'listening') {
      // Syncs Background's `listening` with Transformer's.
      this.mask.listening(this.listening())
    }
  }

  setNodes(nodes?: Node<NodeConfig>[]) {
    if (nodes?.length) {
      const layer = this.getLayer()
      layer?.add(this.mask)
    }
    else {
      this.mask.remove()
    }

    super.setNodes(nodes)

    return this
  }
}
