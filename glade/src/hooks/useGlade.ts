import { fileToBase64, loadImage } from '@/utils'
import { GLADE, GLADE_CONFIG } from '@/utils/storage'
import { Glade, type GladeEventView, type GladeNodeObj } from '@glade/core'
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
  'glade-plugin-image': GladePluginImageStore
}

export default function useGlade(target: MaybeRefOrGetter<HTMLDivElement | null | undefined>) {
  let glade: Glade | undefined

  const isUndoable = ref(false)
  const isRedoable = ref(false)

  const updateSave = useDebounceFn(() => {
    const nodes = glade?.workspace.objectNode(glade.workspace.getAllNode() || [])

    // GladeImage's dataURL property is not saved
    nodes?.forEach((item, index) => {
      if (item.className === 'GladeImage' && item.attrs.dataURL) {
        delete nodes[index].attrs.dataURL
      }
    })

    GLADE.value = nodes
  }, 500)

  const updateView = useDebounceFn((e: GladeEventView) => {
    const { x, y, zoom } = e.value
    GLADE_CONFIG.value.view.x = x
    GLADE_CONFIG.value.view.y = y
    GLADE_CONFIG.value.view.zoom = zoom
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
      .use(GladePluginGridBackground, { enable: GLADE_CONFIG.value.view.grid })
      .use(GladePluginSelection, { enable: true })
      .use(GladePluginImageStore, { enable: true })
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

  function enablePlugin<T extends keyof UsePlugins>(pluginName: T) {
    return glade?.enablePlugin(pluginName)
  }

  function disablePlugin<T extends keyof UsePlugins>(pluginName: T) {
    glade?.workspace.selectNode([])
    return glade?.disablePlugin(pluginName)
  }

  function setupEventListeners() {
    glade?.history.on('change', handleHistoryChange)
    glade?.workspace.on('update-view', updateView)
    glade?.workspace.container.addEventListener('contextmenu', handleContextmenu)
    document.addEventListener('paste', handlePaste)
  }

  function cleanupEventListeners() {
    glade?.history.off('change', handleHistoryChange)
    glade?.workspace.off('update-view', updateView)
    glade?.workspace.container.removeEventListener('contextmenu', handleContextmenu)
    document.removeEventListener('paste', handlePaste)
  }

  function handleHistoryChange() {
    isUndoable.value = glade?.history.isUndoable || false
    isRedoable.value = glade?.history.isRedoable || false

    // Save all current nodes
    updateSave()
  }

  function handleContextmenu(e: any) {
    const target = glade?.workspace.getIntersection(e)
    isRightClickNode.value = !!target?.length
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

  function getZoom() {
    return glade?.workspace.zoom || 1
  }

  function setZoom(value: number) {
    glade && (glade.workspace.zoom = value)
  }

  function undo() {
    glade?.history.undo()
  }

  function redo() {
    glade?.history.redo()
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
      glade.workspace._tr.nodes(nodes)
      glade.workspace.addNode(nodes)
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (error) {
      const node = glade.workspace.createNode('GladeText', {
        text: clipboardText,
        x: point?.x,
        y: point?.y,
        fontSize: 20,
      })
      glade.workspace._tr.nodes([node])
      glade.workspace.addNode(node)
    }
  }

  function selectAll() {
    if (glade) {
      const nodes = glade.workspace.getAllNode() || []
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
      const copyNodes = glade.workspace.objectNode(selectedNode)
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

  function handleDelete() {
    if (glade) {
      const selectedNode = glade.workspace.selectedNodes || []
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
        glade?.workspace._tr.nodes([node])
        glade?.workspace.addNode(node)
      }
    }
    catch (error) {
      console.error('Failed to create image:', error)
    }
  }

  return {
    enablePlugin,
    disablePlugin,
    getZoom,
    setZoom,
    undo,
    redo,
    paste,
    selectAll,
    changeBgShow,
    copy,
    sendBackward,
    bringForward,
    sendToBack,
    bringToFront,
    handleDelete,
    isUndoable,
    isRedoable,
    isRightClickNode,
    createImage,
  }
}
