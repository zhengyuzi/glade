import presetWind from '@unocss/preset-wind3'
import {
  defineConfig,
  presetIcons,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
})
