import type { GladeNodeObj } from '@glade-app/core'
import { StorageSerializers, useStorage } from '@vueuse/core'
import { version } from '../../package.json'

export interface GladeConfig {
  version: string
  toolbar: {
    direction: 'vertical' | 'horizontal'
    x: number
    y: number
  }
  view: {
    x: number
    y: number
    zoom: number
    grid: boolean
  }
  locale: string
}

export const GLADE_CONFIG_DEFAULT: GladeConfig = {
  version,
  toolbar: {
    x: 25,
    y: 150,
    direction: 'vertical',
  },
  view: {
    x: 0,
    y: 0,
    zoom: 1,
    grid: false,
  },
  locale: navigator.language,
}

export const GLADE_CONFIG = useStorage<GladeConfig>(
  'GLADE_CONFIG',
  GLADE_CONFIG_DEFAULT,
  undefined,
  {
    serializer: StorageSerializers.object,
    mergeDefaults: true,
  },
)

export const GLADE = useStorage<GladeNodeObj[]>(
  'GLADE',
  [],
  undefined,
  {
    serializer: StorageSerializers.object,
  },
)
