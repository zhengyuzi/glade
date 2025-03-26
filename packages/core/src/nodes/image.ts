import type { ImageConfig } from 'konva/lib/shapes/Image'
import { Image as KonvaImage } from 'konva/lib/shapes/Image'
import { nanoid } from 'nanoid'
import { GladeNodeBase } from './node'

type OmitImageConfig = Partial<Omit<ImageConfig, 'image'>>

export interface GladeImageConfig extends OmitImageConfig {
  image?: CanvasImageSource
  dataURL?: string
}

export class GladeImage extends GladeNodeBase<KonvaImage> {
  constructor(config: GladeImageConfig = {}) {
    const image = new Image()

    image.src = config.dataURL || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='rgb(107,114,128)' d='M19.999 4h-16c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2m-13.5 3a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3m5.5 10h-7l4-5l1.5 2l3-4l5.5 7z'/%3E%3C/svg%3E`

    const node = new KonvaImage({
      image: config.dataURL ? image : undefined,
      imageId: nanoid(),
      ...config,
    })

    super({
      id: config.id,
      className: 'GladeImage',
      node,
    })

    if (!config.image && !config.dataURL) {
      this._node.sceneFunc((ctx, shape) => {
        const imgWidth = shape.width() / 4
        ctx.fillStyle = '#E5E7EB'
        ctx.fillRect(0, 0, shape.width(), shape.height())
        ctx.drawImage(image, (shape.width() - imgWidth) / 2, (shape.height() - imgWidth) / 2, imgWidth, imgWidth)
      })
    }
  }

  get imageId() {
    return this._node.getAttr('imageId') as string
  }

  get dataURL() {
    return (this._node.image() as HTMLImageElement)?.getAttribute('src')
  }

  image(image: CanvasImageSource) {
    ;(image as HTMLImageElement).onload = () => {
      this._node.sceneFunc((ctx, shape) => {
        ctx.drawImage(image, 0, 0, shape.width(), shape.height())
        ctx.fillShape(shape)
      })
    }

    this._node.setAttr('image', image)

    return this
  }
}
