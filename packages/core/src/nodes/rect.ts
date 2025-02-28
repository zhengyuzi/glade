import type { RectConfig } from 'konva/lib/shapes/Rect'
import { Rect } from 'konva/lib/shapes/Rect'

export interface GladeRectConfig extends RectConfig {

}

export class GladeRect extends Rect {
  className = 'GladeRect'

  constructor(config: GladeRectConfig) {
    super(config)
  }
}
