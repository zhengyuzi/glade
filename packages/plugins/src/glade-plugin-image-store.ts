import type { GladeEventNode, GladeNode, GladePlugin, GladeWorkspace } from '@glade/core'
import { GladeImage } from '@glade/core'

import localforage from 'localforage'

export interface GladePluginImageStoreOptions {
  enable?: boolean
}

export class GladePluginImageStore implements GladePlugin {
  name = 'glade-plugin-image-store'

  isEnable = false

  imageDB: LocalForage

  constructor(public workspace: GladeWorkspace, options: GladePluginImageStoreOptions = {}) {
    const { enable = false } = options

    this.imageDB = localforage.createInstance({
      name: 'GladeImageDB',
    })

    enable && this.enable()
  }

  enable() {
    if (!this.isEnable) {
      const nodes = this.workspace.getAllNode()

      this.isEnable = true
      this.handleNodeImage(nodes)
      this.workspace.on('node:add', this._handleNodeImage)
      this.workspace.on('node:remove', this._handleRemoveImage)
      this.workspace.on('node:object', this._handleObjectImage)
      this.workspace.on('node:load', this._handleNodeImage)
    }
  }

  disable() {
    if (this.isEnable) {
      this.workspace.off('node:add', this._handleNodeImage)
      this.workspace.off('node:remove', this._handleRemoveImage)
      this.workspace.off('node:object', this._handleObjectImage)
      this.workspace.off('node:load', this._handleNodeImage)
      this.isEnable = false
    }
  }

  private _handleNodeImage = async (e: GladeEventNode) => this.handleNodeImage(e.nodes)

  private handleNodeImage = async (nodes: GladeNode[]) => {
    for (const node of nodes) {
      if (node instanceof GladeImage) {
        const imageId = node.imageId
        const imageEl = node.image() as HTMLImageElement
        const src = imageEl.getAttribute('src')
        const dataURL = node.getAttr('dataURL')

        try {
          const imageData = await this.imageDB.getItem<string>(imageId)

          if (imageData) {
            if (!src) {
              const image = new Image()
              image.src = imageData
              node.image(image)
              !dataURL && node.setAttr('dataURL', imageData)
            }
          }
          else if (dataURL) {
            const image = new Image()
            image.src = dataURL
            node.image(image)
            this.imageDB.setItem(imageId, dataURL)
          }
          else if (src) {
            this.imageDB.setItem(imageId, src)
          }
        }
        catch (error) {
          console.error(`Error accessing image database:`, error)
        }
      }
    }
  }

  private _handleObjectImage = async (e: GladeEventNode) => {
    for (const node of e.nodes) {
      if (node instanceof GladeImage) {
        const imageId = node.imageId

        try {
          const imageData = await this.imageDB.getItem<string>(imageId)
          node.setAttr('dataURL', imageData)
        }
        catch (error) {
          console.error(`Error accessing image database:`, error)
        }
      }
    }
  }

  private _handleRemoveImage = async (e: GladeEventNode) => {
    for (const node of e.nodes) {
      if (node instanceof GladeImage) {
        const nodes = this.workspace.getAllNode()
        const id = node.id()
        const imageId = node.imageId

        if (!imageId) {
          continue
        }

        try {
          const inUse = nodes.some((item) => {
            if (item instanceof GladeImage && item.id() !== id) {
              return item.imageId === imageId
            }
            return false
          })

          !inUse && await this.imageDB.removeItem(imageId)
        }
        catch (error) {
          console.error(`Failed to remove image from database:`, error)
        }
      }
    }
  }

  destroy() {
    this.disable()
  }
}
