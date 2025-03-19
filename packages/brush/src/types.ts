import type Konva from 'konva'

export interface GladeBrush {
  sceneFunc: (context: Konva.Context, shape: Konva.Shape) => void
}
