import type { GladeNodeObj } from '@glade/core'
import { fileToBase64, loadImage } from '@/utils'
import { GLADE, GLADE_CONFIG } from '@/utils/storage'
import { Glade } from '@glade/core'
import {
  GladePluginBrush,
  GladePluginDragPan,
  GladePluginGridBackground,
  GladePluginImageStore,
  GladePluginResizeObserver,
  GladePluginSelection,
  GladePluginText,
} from '@glade/plugins'
import { tryOnScopeDispose, unrefElement, useDebounceFn } from '@vueuse/core'

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
  let glade: Glade | undefined

  const isUndo = ref(false)
  const isRedo = ref(false)

  const updateSave = useDebounceFn(() => {
    GLADE.value = glade?.workspace.objectNode(glade.workspace.nodes)
  }, 500)

  const updateView = useDebounceFn(() => {
    if (glade) {
      GLADE_CONFIG.value.view.x = glade.workspace.x
      GLADE_CONFIG.value.view.y = glade.workspace.y
      GLADE_CONFIG.value.view.zoom = glade.workspace.zoom
    }
  }, 300)

  const isRightClickNode = ref(false)

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

    setupEventListeners()
  })

  tryOnScopeDispose(() => destroy())

  onUnmounted(() => destroy())

  function destroy() {
    cleanupEventListeners()
    glade?.destroy()
    glade = undefined
  }

  function getPlugin<T extends keyof UsePlugins>(pluginName: T) {
    return glade?.getPlugin<UsePlugins[T]>(pluginName)
  }

  function enablePlugin<T extends keyof UsePlugins>(pluginName: T) {
    return glade?.enablePlugin(pluginName)
  }

  function disablePlugin<T extends keyof UsePlugins>(pluginName: T) {
    glade?.workspace.selectNode([])
    return glade?.disablePlugin(pluginName)
  }

  function setupEventListeners() {
    glade?.workspace.on('history:change', handleHistoryChange)
    glade?.workspace.on('history:undo', handleHistoryChange)
    glade?.workspace.on('history:redo', handleHistoryChange)
    glade?.workspace.on('view:update', updateView)
    glade?.workspace.container.addEventListener('contextmenu', handleContextmenu)
    document.addEventListener('paste', handlePaste)
  }

  function cleanupEventListeners() {
    glade?.workspace.off('history:change', handleHistoryChange)
    glade?.workspace.on('history:undo', handleHistoryChange)
    glade?.workspace.on('history:redo', handleHistoryChange)
    glade?.workspace.off('view:update', updateView)
    glade?.workspace.container.removeEventListener('contextmenu', handleContextmenu)
    document.removeEventListener('paste', handlePaste)
  }

  function handleHistoryChange() {
    isUndo.value = glade?.history.isUndo || false
    isRedo.value = glade?.history.isRedo || false

    // Save all current nodes
    updateSave()
  }

  function handleContextmenu(e: any) {
    const target = glade?.workspace.getIntersection(e)
    isRightClickNode.value = !!target?.length
  }

  function undo() {
    glade?.history.undo()
  }

  function redo() {
    glade?.history.redo()
  }

  async function handlePaste(event: ClipboardEvent) {
    event.preventDefault()

    const clipboardItems = event.clipboardData?.items || []

    for (const clipboardItem of clipboardItems) {
      if (clipboardItem.type?.includes('image')) {
        const file = clipboardItem.getAsFile()

        if (file) {
          const base64 = await fileToBase64(file)
          await createImage(base64)
        }
      }
      else {
        await paste()
      }
    }
  }

  function setZoom(value: number) {
    glade && (glade.workspace.zoom = value)
  }

  async function paste() {
    if (!glade) {
      return
    }

    const point = glade.workspace.pointerPosition

    const clipboardText = await navigator.clipboard.readText()

    if (!clipboardText) {
      return
    }

    // Try to convert the pasted text to Glade node. If it fails, convert it to text.
    try {
      const nodeObjs = (JSON.parse(clipboardText) || []) as GladeNodeObj[]
      const nodes = glade.workspace.loadNode(nodeObjs)
      glade.workspace.addNode(nodes, { select: true })
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (error) {
      const node = glade.workspace.createNode('GladeText', {
        text: clipboardText,
        x: point?.x,
        y: point?.y,
        fontSize: 20,
      })
      glade.workspace.addNode(node, { select: true })
    }
  }

  function selectAll() {
    if (glade) {
      const nodes = glade.workspace.nodes
      nodes.length && glade.workspace.selectNode(nodes)
    }
  }

  function changeBgShow() {
    const isEnable = GLADE_CONFIG.value.view.grid

    isEnable
      ? disablePlugin('glade-plugin-grid-background')
      : enablePlugin('glade-plugin-grid-background')

    GLADE_CONFIG.value.view.grid = !isEnable
  }

  async function copy(remove = false) {
    if (!glade) {
      return
    }

    const selectedNode = glade.workspace.selectedNodes || []

    if (!selectedNode.length) {
      return
    }

    try {
      const copyNodes = glade.workspace.objectNode(selectedNode, { dataURL: true })
      await navigator.clipboard.writeText(JSON.stringify(copyNodes))
      remove && glade.workspace.removeNode(selectedNode)
    }
    catch (error) {
      console.error('Error: Copy or cut node failed.', error)
    }
  }

  function sendBackward() {
    glade?.workspace.sendBackward(glade.workspace.selectedNodes)
  }

  function bringForward() {
    glade?.workspace.bringForward(glade.workspace.selectedNodes)
  }

  function sendToBack() {
    glade?.workspace.sendToBack(glade.workspace.selectedNodes)
  }

  function bringToFront() {
    glade?.workspace.bringToFront(glade.workspace.selectedNodes)
  }

  function remove() {
    if (glade) {
      const selectedNode = glade.workspace.selectedNodes
      selectedNode.length && glade.workspace.removeNode(selectedNode)
      glade.workspace.cursor = 'default'
    }
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
    isUndo,
    isRedo,
    isRightClickNode,
    getPlugin,
    enablePlugin,
    disablePlugin,
    undo,
    redo,
    setZoom,
    remove,
    paste,
    selectAll,
    changeBgShow,
    copy,
    sendBackward,
    bringForward,
    sendToBack,
    bringToFront,
    createImage,
  }
}
