<script setup lang="ts">
import type useGlade from '@/hooks/useGlade'
import type { IToggleGroup } from '@/types'
import type { GladeBrushType } from '@glade/plugins'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { getPlugin } = inject<ReturnType<typeof useGlade>>('glade')!

const brush = getPlugin('glade-plugin-brush')

const color = ref('#000000')
const opacity = ref([100])
const width = ref([8])
const brushType = ref('default')

const brushTypes: IToggleGroup[] = [
  {
    value: 'default',
    content: () => h('span', 'Default'),
  },
]

brush?.config({
  strokeColor: color.value,
  strokeWidth: width.value[0],
  strokeOpacity: opacity.value[0],
})

function updateWidth(value: number[]) {
  width.value = value
  brush?.config({ strokeWidth: value[0] })
}

function updateOpacity(value: number[]) {
  opacity.value = value
  brush?.config({ strokeOpacity: value[0] / 100 })
}

function updateColor(value: string) {
  color.value = value
  brush?.config({ strokeColor: value })
}

function updateBrushType(type: GladeBrushType) {
  brush?.config({ brushType: type })
}
</script>

<template>
  <div class="text-xs space-y-3">
    <div class="space-y-1 text-gray-600">
      <span>{{ t('color') }} {{ color }}</span>
      <GladeColorPicker :size="32" @change="updateColor" />
    </div>
    <div class="space-y-1 text-gray-600">
      <span>{{ t('brush_type') }}</span>
      <GladeToggleGroup
        v-model="brushType"
        aria-label="brush_type"
        :options="brushTypes"
        @update:model-value="updateBrushType"
      />
    </div>
    <div class="space-y-1 text-gray-600">
      <span>{{ t('stroke_width') }} {{ width[0] }}</span>
      <GladeSlider
        :min="2"
        :max="20"
        :default-value="[width]"
        @update:model-value="updateWidth"
      />
    </div>
    <div class="space-y-1 text-gray-600">
      <span>{{ t('opacity') }} {{ opacity[0] }}</span>
      <GladeSlider
        :default-value="[opacity]"
        @update:model-value="updateOpacity"
      />
    </div>
  </div>
</template>
