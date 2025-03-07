<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const sliderValue = ref([100])

function updateSliderValue(value: number[]) {
  sliderValue.value = value
}
</script>

<template>
  <div class="text-xs space-y-3">
    <div class="space-y-1 text-gray-600">
      <span>{{ t('color') }}</span>
      <GladeColorPicker :size="32" />
    </div>
    <div class="space-y-1 text-gray-600">
      <span>{{ t('stroke_width') }}</span>
    </div>
    <div class="space-y-1 text-gray-600">
      <span>{{ t('opacity') }} {{ sliderValue[0] }}</span>
      <GladeSlider :default-value="[sliderValue]" @update:model-value="updateSliderValue" />
    </div>
  </div>
</template>
