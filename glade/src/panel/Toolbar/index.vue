<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { ITool } from '@/types'
import type { GladeHookEvent } from '@glade-app/core'
import type { Position } from '@vueuse/core'
import { fileToBase64 } from '@/utils'
import { hotkey } from '@/utils/hotkeys'
import { GLADE_CONFIG } from '@/utils/storage'
import { useDraggable, useElementSize, useFileDialog } from '@vueuse/core'
import BrushTab from '../Tooltab/Brush/index.vue'
import TextTab from '../Tooltab/Text/index.vue'

const draggableEl = useTemplateRef<HTMLElement>('draggableEl')
const handleEl = useTemplateRef<HTMLElement>('handleEl')

const { workspace, disablePlugin, enablePlugin, createImage } = inject<ReturnType<typeof useGlade>>('glade')!

const { width: toolbarW, height: toolbarH } = useElementSize(draggableEl, { width: 0, height: 0 })

const { style, isDragging } = useDraggable(draggableEl, {
  initialValue: GLADE_CONFIG.value.toolbar,
  handle: handleEl,
  preventDefault: true,
  stopPropagation: true,
  onEnd: onDragEnd,
})

const {
  onChange: onImageChange,
  open: openSelectImage,
  onCancel: onSelectImageCancel,
  reset: resetSelectImage,
} = useFileDialog({
  accept: 'image/*',
  directory: false,
})

const tools: ITool[] = [
  {
    name: 'selection',
    iconName: 'i-mage-mouse-pointer-fill',
    enable: () => enablePlugin('glade-plugin-selection'),
    disable: () => disablePlugin('glade-plugin-selection'),
  },
  {
    name: 'drag',
    iconName: 'i-fa6-solid-hand',
    enable: () => enablePlugin('glade-plugin-drag-pan'),
    disable: () => disablePlugin('glade-plugin-drag-pan'),
  },
  {
    name: 'brush',
    iconName: 'i-solar-pen-bold',
    enable: () => enablePlugin('glade-plugin-brush'),
    disable: () => disablePlugin('glade-plugin-brush'),
    tab: () => h(BrushTab),
  },
  {
    name: 'text',
    iconName: 'i-mingcute-text-2-fill',
    enable: () => {
      enablePlugin('glade-plugin-text')
      workspace.value?.on('node:add', handleTextAdd)
    },
    disable: () => {
      disablePlugin('glade-plugin-text')
      workspace.value?.off('node:add', handleTextAdd)
    },
    tab: () => h(TextTab),
  },
  {
    name: 'image',
    iconName: 'i-fa6-solid-image',
    enable: () => openSelectImage(),
    disable: () => {},
  },
]

const currentTool = ref(tools[0].name)

const isVertical = computed(() => GLADE_CONFIG.value.toolbar.direction === 'vertical')

const popoverOpen = ref(true)

onMounted(() => {
  // Add hotkeys to the toolbar in the order of `index+1`
  tools.forEach((tool, index) => hotkey(`${index + 1}`, () => changeTool(tool.name)))

  // Press and hold the 'space' key to start dragging
  hotkey('space', (event) => {
    if (event.type === 'keydown' && currentTool.value !== 'drag') {
      changeTool('drag')
    }
    else if (event.type === 'keyup' && currentTool.value !== 'selection') {
      changeTool('selection')
    }
  }, { keyup: true })

  // Reset tool to selection when all selected
  hotkey('Ctrl+A', () => resetTool())
})

onSelectImageCancel(() => resetTool())

onImageChange(async (files) => {
  for (const file of files || []) {
    const base64 = await fileToBase64(file)
    await createImage(base64)
  }
  resetSelectImage()
  resetTool()
})

function handleTextAdd(e: GladeHookEvent) {
  if (e.nodes.length === 1 && e.nodes[0].className === 'GladeText') {
    resetTool()
  }
}

function changeTool(name: string) {
  popoverOpen.value = currentTool.value === name ? !popoverOpen.value : true

  if (currentTool.value === name) {
    return
  }

  const lastTool = tools.find(item => item.name === currentTool.value)
  const tool = tools.find(item => item.name === name)

  lastTool?.disable()
  tool?.enable()

  currentTool.value = name
}

function selectTool(name: string) {
  changeTool(name)
  workspace.value?.selectNode([])
}

function resetTool() {
  changeTool(tools[0].name)
}

function switchDirection() {
  GLADE_CONFIG.value.toolbar.direction = isVertical.value ? 'horizontal' : 'vertical'
}

function onDragEnd(position: Position) {
  position.x = Math.min(window.innerWidth - toolbarW.value, Math.max(0, position.x))
  position.y = Math.min(window.innerHeight - toolbarH.value, Math.max(0, position.y))

  GLADE_CONFIG.value.toolbar.x = position.x
  GLADE_CONFIG.value.toolbar.y = position.y
}
</script>

<template>
  <div
    ref="draggableEl"
    :style="style"
  >
    <GladeButtonGroup
      class="text-2xl p-1.5"
      :class="isVertical ? 'flex-col space-y-2' : 'space-x-2'"
    >
      <!-- Draggable handle -->
      <GladeButton ref="handleEl" class="cursor-move">
        <i
          class="i-akar-icons-drag-horizontal-fill"
          :class="isVertical ? '' : 'transform rotate-90'"
        />
      </GladeButton>
      <!-- Tool buttons -->
      <template v-for="tool in tools">
        <template v-if="tool.tab">
          <GladePopover
            :key="tool.name"
            :open="currentTool === tool.name && !isDragging && popoverOpen"
            :side="isVertical ? 'right' : 'bottom'"
          >
            <GladeButton
              class="relative border-2 shadow-md rounded-md p-1 active:(scale-90)"
              :class="currentTool === tool.name ? 'bg-gray-500 !text-gray-100 border-gray-50' : 'border-gray-400 bg-gray-300'"
              @click="() => selectTool(tool.name)"
            >
              <i :class="tool.iconName" />
            </GladeButton>
            <template #content>
              <GladeButton
                class="rounded-full h-[20px] w-[20px] inline-flex items-center justify-center absolute top-4 right-4 active:(scale-90)"
                @click="popoverOpen = false"
              >
                <i class="i-ic-round-close" />
              </GladeButton>
              <component :is="tool.tab" class="p-4" />
            </template>
          </GladePopover>
        </template>
        <template v-else>
          <GladeButton
            :key="tool.name"
            class="relative border-2 shadow-md rounded-md p-1 active:(scale-90)"
            :class="currentTool === tool.name ? 'bg-gray-500 !text-gray-100 border-gray-50' : 'border-gray-400 bg-gray-300'"
            @click="() => selectTool(tool.name)"
          >
            <i :class="tool.iconName" />
          </GladeButton>
        </template>
      </template>
      <!-- Switch direction -->
      <GladeButton @click="switchDirection">
        <i class="i-f7-camera-rotate-fill" />
      </GladeButton>
    </GladeButtonGroup>
  </div>
</template>
