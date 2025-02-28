import type { TextConfig } from 'konva/lib/shapes/Text'
import { Text } from 'konva/lib/shapes/Text'

export interface GladeTextConfig extends TextConfig {

}

export class GladeText extends Text {
  className = 'GladeText'

  constructor(config: GladeTextConfig) {
    super(config)
  }
}
