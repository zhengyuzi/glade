import type { GladeNodeBaseType } from '../types'
import { nanoid } from 'nanoid'

export interface GladeNodeBaseConfig {
  id?: string
  className: string
  node: GladeNodeBaseType
}

export abstract class GladeNodeBase<NodeType extends GladeNodeBaseType> {
  className: string

  id: string

  _node: NodeType

  constructor(config: GladeNodeBaseConfig) {
    const { id, className, node } = config
    this.id = id || nanoid()

    this._node = node as NodeType

    this._node.id(this.id)

    this.className = className
    this._node.className = className
  }

  setAttrs(config: Record<string, any>) {
    this._node.setAttrs(config)
    return this
  }

  setZIndex(zIndex: number) {
    this._node.setZIndex(zIndex)
    return this
  }

  getAttr(attr: string) {
    return this._node.getAttr(attr)
  }

  getAttrs() {
    return this._node.getAttrs()
  }

  getClientRect() {
    return this._node.getClientRect()
  }

  getAbsoluteTransform() {
    return this._node.getAbsoluteTransform()
  }
}
