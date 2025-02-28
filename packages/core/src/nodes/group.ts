import type { ContainerConfig } from 'konva/lib/Container'
import type { GladeNode } from '../types'
import { Group } from 'konva/lib/Group'
import { nanoid } from 'nanoid'

export interface GladeGroupConfig extends ContainerConfig {}

export class GladeGroup extends Group {
  className = 'GladeGroup'

  constructor(config: GladeGroupConfig = {}) {
    super(config)
  }

  add(...children: GladeNode[]) {
    for (const node of children) {
      // Set node id
      !node.id() && node.setAttr('id', nanoid())
    }
    super.add(...children)
    return this
  }
}
