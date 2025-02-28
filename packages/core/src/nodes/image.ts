import type { ImageConfig } from 'konva/lib/shapes/Image'
import type { GetSet } from 'konva/lib/types'
import { Image as KonvaImage } from 'konva/lib/shapes/Image'
import { nanoid } from 'nanoid'

type OmitImageConfig = Partial<Omit<ImageConfig, 'image'>>

export interface GladeImageConfig extends OmitImageConfig {
  image?: CanvasImageSource
}

export class GladeImage extends KonvaImage {
  className = 'GladeImage'

  constructor(config: GladeImageConfig) {
    const image = new Image()
    image.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='rgb(107,114,128)' d='M19.999 4h-16c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2m-13.5 3a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3m5.5 10h-7l4-5l1.5 2l3-4l5.5 7z'/%3E%3C/svg%3E`

    super({
      image: new Image(),
      ...config,
    })

    if (config.image) {
      this.setAttr('imageId', nanoid())
    }
    else {
      this.sceneFunc((ctx, shape) => {
        const imgWidth = shape.width() / 4
        ctx.fillStyle = '#E5E7EB'
        ctx.fillRect(0, 0, shape.width(), shape.height())
        ctx.drawImage(image, (shape.width() - imgWidth) / 2, (shape.height() - imgWidth) / 2, imgWidth, imgWidth)
      })
    }
  }

  image: GetSet<CanvasImageSource | undefined, this> = function (this: GladeImage, image?: CanvasImageSource) {
    if (!image) {
      return this.getAttr('image')
    }

    ;(image as HTMLImageElement).onload = () => {
      this.sceneFunc((ctx, shape) => {
        ctx.drawImage(image, 0, 0, shape.width(), shape.height())
        ctx.fillShape(shape)
      })
      this.setAttr('image', image)
    }

    return this
  }

  get imageId() {
    return this.getAttr('imageId')
  }
}
