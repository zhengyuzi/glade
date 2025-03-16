import type { LineConfig } from 'konva/lib/shapes/Line'
import { Line } from 'konva/lib/shapes/Line'
import { GladeNodeBase } from './node'

export interface GladeLineConfig extends LineConfig {}

export class GladeLine extends GladeNodeBase<Line> {
  constructor(config: GladeLineConfig = {}) {
    const node = new Line({
      strokeScaleEnabled: false,
      ...config,
    })

    super({
      id: config.id,
      className: 'GladeLine',
      node,
    })
  }

  points(_points?: number[]) {
    if (_points) {
      this._node.points(_points)
    }

    return this._node.points()
  }
}
