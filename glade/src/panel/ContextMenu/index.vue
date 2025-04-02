<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { IContextMenu } from '@/types'
import { fileToBase64 } from '@/utils'
import { hotkey, unhotkey } from '@/utils/hotkeys'
import { GLADE_CONFIG } from '@/utils/storage'
import { GladeGroup, type GladeNodeObj } from '@glade-app/core'
import { useI18n } from 'vue-i18n'

const { workspace, createImage, disablePlugin, enablePlugin } = inject<ReturnType<typeof useGlade>>('glade')!

const { t } = useI18n()

// Whether the node is clicked when right clicking
const isRightClickNode = ref(false)

const menu = reactive<IContextMenu[]>([
  {
    type: 'item',
    text: t('paste'),
    hotkey: 'Ctrl+V',
    fn: async () => await paste(),
  },
  {
    type: 'item',
    text: t('select_all'),
    hotkey: 'Ctrl+A',
    fn: () => selectAll(),
  },
  {
    type: 'separator',
  },
  {
    type: 'item',
    text: t('grid_background'),
    hotkey: 'Ctrl+\\',
    fn: () => changeBgShow(),
  },
])

const nodeMenu = reactive<IContextMenu[]>([
  {
    type: 'item',
    text: t('cut'),
    hotkey: 'Ctrl+X',
    fn: async () => await copy(true),
  },
  {
    type: 'item',
    text: t('copy'),
    hotkey: 'Ctrl+C',
    fn: async () => await copy(),
  },
  {
    type: 'separator',
  },
  {
    type: 'item',
    text: t('group_selection'),
    hotkey: 'Ctrl+G',
    fn: () => groupSelection(),
    show: () => isMultipleNodes(),
  },
  {
    type: 'item',
    text: t('ungroup_selection'),
    hotkey: 'Ctrl+G',
    fn: () => ungroupSelection(),
    show: () => isGroup(),
  },
  {
    type: 'separator',
    show: () => isMultipleNodes() || isGroup(),
  },
  {
    type: 'item',
    text: t('send_backward'),
    hotkey: 'Ctrl+[',
    fn: () => sendBackward(),
  },
  {
    type: 'item',
    text: t('bring_forward'),
    hotkey: 'Ctrl+]',
    fn: () => bringForward(),
  },
  {
    type: 'item',
    text: t('send_to_back'),
    hotkey: 'Ctrl+Shift+[',
    fn: () => sendToBack(),
  },
  {
    type: 'item',
    text: t('bring_to_front'),
    hotkey: 'Ctrl+Shift+]',
    fn: () => bringToFront(),
  },
  {
    type: 'separator',
  },
  {
    type: 'item',
    text: t('delete'),
    hotkey: 'Delete',
    fn: () => remove(),
    style: 'color: #f43f5e;',
  },
])

onMounted(async () => {
  await nextTick()
  workspace.value?.container.addEventListener('contextmenu', handleContextmenu)
  document.addEventListener('paste', handlePaste)
  hotkey('Ctrl+A', () => selectAll())
  hotkey('Ctrl+\\', () => changeBgShow())
  hotkey('Ctrl+X', async () => await copy(true))
  hotkey('Ctrl+C', async () => await copy())
  hotkey('Ctrl+[', () => sendBackward())
  hotkey('Ctrl+]', () => bringForward())
  hotkey('Ctrl+Shift+[', () => sendToBack())
  hotkey('Ctrl+Shift+]', () => bringToFront())
  hotkey('Ctrl+G', () => changeGroupSelection())
  hotkey('Delete', () => remove())
})

onUnmounted(() => {
  workspace.value?.container.removeEventListener('contextmenu', handleContextmenu)
  document.removeEventListener('paste', handlePaste)
  unhotkey('Ctrl+A')
  unhotkey('Ctrl+\\')
  unhotkey('Ctrl+X')
  unhotkey('Ctrl+C')
  unhotkey('Ctrl+[')
  unhotkey('Ctrl+]')
  unhotkey('Ctrl+Shift+[')
  unhotkey('Ctrl+Shift+]')
  unhotkey('Ctrl+G')
  unhotkey('Delete')
})

function handleContextmenu(e: any) {
  const target = workspace.value?.getIntersection(e)
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

async function paste() {
  if (!workspace.value) {
    return
  }

  const point = workspace.value.pointerPosition

  const clipboardText = await navigator.clipboard.readText()

  if (!clipboardText) {
    return
  }

  // Try to convert the pasted text to Glade node. If it fails, convert it to text.
  try {
    const nodeObjs = (JSON.parse(clipboardText) || []) as GladeNodeObj[]
    const nodes = workspace.value.loadNode(nodeObjs)
    workspace.value.addNode(nodes, { select: true })
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (error) {
    const node = workspace.value.createNode('GladeText', {
      text: clipboardText,
      x: point?.x,
      y: point?.y,
      fontSize: 30,
      fill: '#000000',
    })
    workspace.value.addNode(node, { select: true })
  }
}

async function copy(remove = false) {
  if (!workspace.value) {
    return
  }

  const selectedNode = workspace.value.selectedNodes || []

  if (!selectedNode.length) {
    return
  }

  try {
    const copyNodes = workspace.value.objectNode(selectedNode, { dataURL: true })
    await navigator.clipboard.writeText(JSON.stringify(copyNodes))
    remove && workspace.value.removeNode(selectedNode)
  }
  catch (error) {
    console.error('Error: Copy or cut node failed.', error)
  }
}

function selectAll() {
  const nodes = workspace.value?.nodes || []
  nodes.length && workspace.value?.selectNode(nodes)
}

function changeBgShow() {
  const isEnable = GLADE_CONFIG.value.view.grid

  isEnable
    ? disablePlugin('glade-plugin-grid-background')
    : enablePlugin('glade-plugin-grid-background')

  GLADE_CONFIG.value.view.grid = !isEnable
}

function sendBackward() {
  workspace.value?.sendNodeBackward(workspace.value.selectedNodes)
}

function bringForward() {
  workspace.value?.bringNodeForward(workspace.value.selectedNodes)
}

function sendToBack() {
  workspace.value?.sendNodeToBack(workspace.value.selectedNodes)
}

function bringToFront() {
  workspace.value?.bringNodeToFront(workspace.value.selectedNodes)
}

function remove() {
  if (!workspace.value) {
    return
  }

  const selectedNode = workspace.value.selectedNodes
  selectedNode.length && workspace.value.removeNode(selectedNode)
  workspace.value.cursor = 'default'
}

function isMultipleNodes() {
  const selectedNodes = workspace.value?.selectedNodes || []
  return selectedNodes.length > 1
}

function isGroup() {
  const selectedNodes = workspace.value?.selectedNodes || []
  return selectedNodes.length === 1 && selectedNodes.some(item => item instanceof GladeGroup)
}

function groupSelection() {
  if (workspace.value) {
    const selectedNode = workspace.value.selectedNodes
    selectedNode.length && workspace.value.group(selectedNode)
  }
}

function ungroupSelection() {
  if (workspace.value) {
    const selectedNode = workspace.value.selectedNodes
    selectedNode.forEach(node => node instanceof GladeGroup && workspace.value?.ungroup(node))
  }
}

function changeGroupSelection() {
  if (isGroup()) {
    ungroupSelection()
  }
  else if (isMultipleNodes()) {
    groupSelection()
  }
}
</script>

<template>
  <GladeContextMenu :options="isRightClickNode ? nodeMenu : menu">
    <slot />
  </GladeContextMenu>
</template>
