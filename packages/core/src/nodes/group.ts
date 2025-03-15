import type { ContainerConfig } from 'konva/lib/Container'
import type { GladeNode } from '../types'
import { Group } from 'konva/lib/Group'
import { GladeNodeBase } from './node'

export interface GladeGroupConfig extends ContainerConfig {}

export class GladeGroup extends GladeNodeBase<Group> {
  constructor(config: GladeGroupConfig = {}) {
    const node = new Group(config)

    super({
      id: config.id,
      className: 'GladeGroup',
      node,
    })
  }

  get children() {
    return this._node.children
  }

  add(...children: GladeNode[]) {
    this._node.add(...children.map(item => item._node))
    return this
  }

  clear() {
    this._node.destroyChildren()
    return this
  }
}
