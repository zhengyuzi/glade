import Konva from 'konva'
import { GladeLayer } from './layer'
import { GladeTransformer } from './transformer'

export class GladeCore {
  stage: Konva.Stage
  background: GladeLayer
  canvas: GladeLayer
  foreground: GladeLayer
  transformer: GladeTransformer

  constructor(container: string | HTMLDivElement) {
    const el = typeof container === 'string' ? document.querySelector(container) : container

    this.stage = new Konva.Stage({
      container,
      width: el?.clientWidth,
      height: el?.clientHeight,
    })

    this.stage.container().className = `glade ${this.stage.container().className}`
    this.stage.container().style.touchAction = 'none'
    this.stage.content.className = 'glade-content'

    this.canvas = new GladeLayer()
    this.background = new GladeLayer()
    this.foreground = new GladeLayer()
    this.transformer = new GladeTransformer({
      fill: 'rgba(107, 114, 128, 0.1)',
      borderStroke: 'rgb(107, 114, 128)',
      anchorStroke: 'rgb(107, 114, 128)',
      borderDash: [5, 5],
    })

    this.foreground.add(this.transformer._node)
    this.stage.add(this.background, this.canvas, this.foreground)
  }

  destroy() {
    this.stage.destroy()
  }
}
