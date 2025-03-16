import type { LayerConfig } from 'konva/lib/Layer'
import type { GladeNode } from '../types'
import Konva from 'konva'

export class GladeLayer extends Konva.Layer {
  gladeNodes: GladeNode[] = []

  constructor(config?: LayerConfig) {
    super(config)
  }

  addGladeNode(...children: GladeNode[]) {
    this.add(...children.map(item => item._node))
    this.gladeNodes.push(...children)
    return this
  }

  removeGladeNode(...children: GladeNode[]) {
    children.forEach((item) => {
      const index = this.gladeNodes.findIndex(n => n.id === item.id)
      if (index !== -1) {
        const node = this.gladeNodes[index]
        node._node.remove()
        this.gladeNodes.splice(index, 1)
      }
    })
    return this
  }
}
