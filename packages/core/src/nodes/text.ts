import type { TextConfig } from 'konva/lib/shapes/Text'
import { Text } from 'konva/lib/shapes/Text'
import { GladeNodeBase } from './node'

export interface GladeTextConfig extends TextConfig {}

export class GladeText extends GladeNodeBase<Text> {
  constructor(config: GladeTextConfig = {}) {
    const node = new Text(config)

    super({
      id: config.id,
      className: 'GladeText',
      node,
    })
  }
}
