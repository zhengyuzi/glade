import type { GladeHistory, GladeWorkspace } from '@glade-app/core'
import { loadImage } from '@/utils'
import { GLADE, GLADE_CONFIG } from '@/utils/storage'
import { Glade } from '@glade-app/core'
import {
  GladePluginBrush,
  GladePluginDragPan,
  GladePluginGridBackground,
  GladePluginImageStore,
  GladePluginResizeObserver,
  GladePluginSelection,
  GladePluginText,
} from '@glade-app/plugins'
import { unrefElement, useDebounceFn } from '@vueuse/core'

export interface UsePlugins {
  'glade-plugin-selection': GladePluginSelection
  'glade-plugin-grid-background': GladePluginGridBackground
  'glade-plugin-drag-pan': GladePluginDragPan
  'glade-plugin-brush': GladePluginBrush
  'glade-plugin-resize-observer': GladePluginResizeObserver
  'glade-plugin-text': GladePluginText
  'glade-plugin-image-store': GladePluginImageStore
}

export default function useGlade(target: MaybeRefOrGetter<HTMLDivElement | null | undefined>) {
  let glade: Glade | null = null

  const workspace = ref<GladeWorkspace>()
  const history = ref<GladeHistory>()

  // Save nodes
  const updateSave = useDebounceFn(() => {
    GLADE.value = glade?.workspace.objectNode(glade.workspace.nodes)
  }, 500)

  // Save views
  const updateView = useDebounceFn(() => {
    if (glade) {
      GLADE_CONFIG.value.view.x = glade.workspace.x
      GLADE_CONFIG.value.view.y = glade.workspace.y
      GLADE_CONFIG.value.view.zoom = glade.workspace.zoom
    }
  }, 300)

  onMounted(() => {
    glade = new Glade(unrefElement(target)!, {
      workspace: {
        position: GLADE_CONFIG.value.view,
        zoom: GLADE_CONFIG.value.view.zoom,
        nodes: [...GLADE.value],
      },
    })
      .use(GladePluginResizeObserver, { enable: true })
      .use(GladePluginSelection, { enable: true })
      .use(GladePluginImageStore, { enable: true })
      .use(GladePluginGridBackground, { enable: GLADE_CONFIG.value.view.grid })
      .use(GladePluginDragPan, { enable: false })
      .use(GladePluginBrush, { enable: false })
      .use(GladePluginText, { enable: false })

    workspace.value = glade.workspace
    history.value = glade.history

    glade.workspace.on('view:update', updateView)
    glade.workspace.on('history:change', updateSave)
    glade.workspace.on('history:undo', updateSave)
    glade.workspace.on('history:redo', updateSave)
  })

  onUnmounted(() => destroy())

  function destroy() {
    glade?.destroy()
    glade = null
  }

  function getPlugin<T extends keyof UsePlugins>(pluginName: T) {
    return glade?.getPlugin<UsePlugins[T]>(pluginName)
  }

  function enablePlugin<T extends keyof UsePlugins>(pluginName: T) {
    return glade?.enablePlugin(pluginName)
  }

  function disablePlugin<T extends keyof UsePlugins>(pluginName: T) {
    return glade?.disablePlugin(pluginName)
  }

  async function createImage(src: string) {
    try {
      const image = await loadImage(src)
      const width = 500
      const height = (width / image.width) * image.height

      const node = glade?.workspace.createNode('GladeImage', {
        image,
        width,
        height,
        x: (glade.workspace.width - width) / 2 - glade.workspace.x,
        y: (glade.workspace.height - height) / 2 - glade.workspace.y,
      })

      if (node) {
        glade?.workspace.addNode(node, { select: true })
      }
    }
    catch (error) {
      console.error('Failed to create image:', error)
    }
  }

  return {
    workspace,
    history,
    getPlugin,
    enablePlugin,
    disablePlugin,
    createImage,
  }
}
