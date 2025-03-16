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

  cache = new Set<string>()

  constructor(public workspace: GladeWorkspace, options: GladePluginImageStoreOptions = {}) {
    const { enable = false } = options

    this.store = localforage.createInstance({
      name: 'GladeImageStore',
    })

    this.store.keys().then((keys) => {
      keys.forEach(key => this.cache.add(key))
      this.workspace.nodes.forEach(async node => node instanceof GladeImage && await this.saveImage(node))
    })

    enable && this.enable()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.workspace.on('node:add', this.handleNodeAdd)
      this.workspace.on('node:remove', this.handleNodeRemove)
      this.workspace.on('history:undo', this.handleImage)
      this.workspace.on('history:redo', this.handleImage)
    }
  }

  disable() {
    if (this.isEnable) {
      this.workspace.off('node:add', this.handleNodeAdd)
      this.workspace.off('node:remove', this.handleNodeRemove)
      this.workspace.off('history:undo', this.handleImage)
      this.workspace.off('history:redo', this.handleImage)
      this.isEnable = false
    }
  }

  private saveImage = async (node: GladeImage) => {
    const imageId = node.imageId
    const isSave = this.cache.has(imageId)

    if (isSave) {
      const imageData = await this.store.getItem<string>(imageId)

      if (imageData) {
        const image = new Image()
        image.src = imageData
        node.image(image)
      }
    }
    else {
      const dataURL = node.dataURL

      if (dataURL) {
        await this.store.setItem(imageId, dataURL)
        this.cache.add(imageId)
      }
    }
  }

  private deleteImage = async (node: GladeImage) => {
    const imageId = node.imageId
    const isSave = this.cache.has(imageId)

    if (isSave) {
      await this.store.removeItem(imageId)
      this.cache.delete(imageId)
    }
  }

  private handleNodeAdd = async (e: GladeHookEvent) => {
    for (const node of e.nodes) {
      if (node instanceof GladeImage)
        await this.saveImage(node)
    }
  }

  private handleNodeRemove = async (e: GladeHookEvent) => {
    for (const node of e.nodes) {
      if (node instanceof GladeImage)
        this.deleteImage(node)
    }
  }

  private handleImage = async (e: GladeHookEvent) => {
    for (const node of e.nodes) {
      if (node instanceof GladeImage) {
        const isExist = this.workspace.nodes.some(item => item.id === node.id)

        if (isExist) {
          await this.saveImage(node)
        }
        else {
          await this.deleteImage(node)
        }
      }
    }
  }

  destroy() {
    this.disable()
    this.cache.clear()
  }
}
