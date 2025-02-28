import type { GladeNode } from './types'
import Konva from 'konva'

export class GladeTransformer extends Konva.Transformer {
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

  setNodes(nodes?: GladeNode[]) {
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

  isTransformerNode(node: GladeNode) {
    return node === this || node?.parent === this || node === this.mask
  }
}
