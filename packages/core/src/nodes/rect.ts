import type { RectConfig } from 'konva/lib/shapes/Rect'
import { Rect } from 'konva/lib/shapes/Rect'
import { GladeNodeBase } from './node'

export interface GladeRectConfig extends RectConfig {}

export class GladeRect extends GladeNodeBase<Rect> {
  constructor(config: GladeRectConfig = {}) {
    const node = new Rect(config)

    super({
      id: config.id,
      className: 'GladeRect',
      node,
    })
  }
}
