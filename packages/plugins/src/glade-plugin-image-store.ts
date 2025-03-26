import type { GladeHookEvent, GladePlugin, GladeWorkspace } from '@glade-app/core'
import { GladeImage } from '@glade-app/core'
import localforage from 'localforage'

export interface GladePluginImageStoreOptions {
  enable?: boolean
}

export class GladePluginImageStore implements GladePlugin {
  name = 'glade-plugin-image-store'

  isEnable = false

  store: LocalForage

  constructor(public workspace: GladeWorkspace, options: GladePluginImageStoreOptions = {}) {
    const { enable = false } = options

    this.store = localforage.createInstance({
      name: 'GladeImageStore',
    })

    enable && this.enable()
  }

  async enable() {
    if (!this.isEnable) {
      this.isEnable = true
      await this.init()
      await this.check()
      this.workspace.on('node:add', this.handleNodeAdd)
      this.workspace.on('node:load', this.handleNodeAdd)
    }
  }

  disable() {
    if (this.isEnable) {
      this.workspace.off('node:add', this.handleNodeAdd)
      this.workspace.off('node:load', this.handleNodeAdd)
      this.isEnable = false
    }
  }

  private init = async () => {
    try {
      const nodes = this.workspace.getFlattenedNodes(this.workspace.nodes)
      nodes.forEach(async node => node instanceof GladeImage && await this.saveImage(node))
    }
    catch (error) {
      console.error('Initialization failed:', error)
    }
  }

  private saveImage = async (node: GladeImage) => {
    try {
      const imageId = node.imageId
      const imageData = await this.store.getItem<string>(imageId)

      if (imageData) {
        const image = new Image()
        image.src = imageData
        node.image(image)
      }
      else {
        const dataURL = node.dataURL

        if (dataURL) {
          await this.store.setItem(imageId, dataURL)
        }
      }
    }
    catch (error) {
      console.error('Error saving image:', error)
    }
  }

  private deleteImage = async (imageId: string) => {
    try {
      const imageData = await this.store.getItem<string>(imageId)
      imageData && await this.store.removeItem(imageId)
    }
    catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  private handleNodeAdd = async (e: GladeHookEvent) => {
    for (const node of e.nodes) {
      if (node instanceof GladeImage) {
        await this.saveImage(node)
      }
    }
  }

  private check = async () => {
    const keys = await this.store.keys()
    const nodes = this.workspace.getFlattenedNodes(this.workspace.nodes)

    for (const key of keys) {
      const isUse = nodes.some(item => item instanceof GladeImage && item.imageId === key)

      if (!isUse) {
        await this.deleteImage(key)
      }
    }
  }

  destroy() {
    this.disable()
  }
}
