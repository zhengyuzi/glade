<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { IContextMenu } from '@/types'
import { hotkey } from '@/utils/hotkeys'
import { useI18n } from 'vue-i18n'

const {
  isRightClickNode,
  paste,
  selectAll,
  changeBgShow,
  copy,
  sendBackward,
  sendToBack,
  bringForward,
  bringToFront,
  remove,
} = inject<ReturnType<typeof useGlade>>('glade')!

const { t } = useI18n()

const menu = computed<IContextMenu[]>(() => [
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

const nodeMenu = computed<IContextMenu[]>(() => [
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

onMounted(() => {
  hotkey('Ctrl+A', () => selectAll())
  hotkey('Ctrl+\\', () => changeBgShow())
  hotkey('Ctrl+X', async () => await copy(true))
  hotkey('Ctrl+C', async () => await copy())
  hotkey('Ctrl+[', () => sendBackward())
  hotkey('Ctrl+]', () => bringForward())
  hotkey('Ctrl+Shift+[', () => sendToBack())
  hotkey('Ctrl+Shift+]', () => bringToFront())
  hotkey('Delete', () => remove())
})
</script>

<template>
  <GladeContextMenu :options="isRightClickNode ? nodeMenu : menu">
    <slot />
  </GladeContextMenu>
</template>
