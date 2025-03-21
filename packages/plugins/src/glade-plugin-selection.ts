import { GladeLine, type GladePlugin, type GladeRect, type GladeWorkspace } from '@glade-app/core'
import { throttle } from 'es-toolkit'

export interface GladePluginSelectionOptions {
  enable?: boolean
  backgroundColor?: string
  borderColor?: string
}

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

export class GladePluginSelection implements GladePlugin {
  name = 'glade-plugin-selection'

  isEnable = false

  isSelecting = false

  private selection: GladeRect

  private startPosition = {
    x: 0,
    y: 0,
  }

  constructor(private workspace: GladeWorkspace, options: GladePluginSelectionOptions = {}) {
    const {
      enable = false,
      backgroundColor = 'rgba(107, 114, 128, 0.1)',
      borderColor = 'rgb(107, 114, 128)',
    } = options

    this.selection = this.workspace.createNode('GladeRect', {
      fill: backgroundColor,
      stroke: borderColor,
      strokeWidth: 1,
      visible: false,
      listening: false,
    })

    this.workspace.addNode(this.selection, { layer: 'foreground' })

    enable && this.enable()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.workspace.cursor = 'default'
      this.workspace.addEventListener('pointerdown', this.handlePointerdown)
      this.workspace.addEventListener('mouseover', this.handleMouseover, { onlyNode: true })
      this.workspace.addEventListener('pointerdown', this.handlePointerdownNode, { onlyNode: true })
    }
  }

  disable() {
    if (this.isEnable) {
      this.workspace.removeEventListener('pointerdown', this.handlePointerdown)
      this.workspace.removeEventListener('mouseover', this.handleMouseover, { onlyNode: true })
      this.workspace.removeEventListener('mouseout', this.handleMouseout, { onlyNode: true })
      this.workspace.removeEventListener('pointerdown', this.handlePointerdownNode, { onlyNode: true })
      document.removeEventListener('pointermove', this.handlePointermove, false)
      document.removeEventListener('pointerup', this.handlePointerup, false)
      this.isEnable = false
    }
  }

  destroy() {
    this.disable()
  }

  private handleMouseover = () => {
    if (!this.isSelecting) {
      this.workspace.cursor = 'move'
      this.workspace.addEventListener('mouseout', this.handleMouseout, { onlyNode: true })
    }
  }

  private handleMouseout = () => {
    this.workspace.cursor = 'default'
    this.workspace.removeEventListener('mouseout', this.handleMouseout, { onlyNode: true })
  }

  private handlePointerdownNode = (e: any) => {
    const nodes = this.workspace.getIntersection(e.evt)
    this.workspace.selectNode(nodes || [])
  }

  private handlePointerdown = (e: any) => {
    const pointer = this.workspace.fixedPointerPosition

    if (!pointer || this.workspace.getIntersection(pointer)?.length)
      return

    this.startPosition.x = pointer.x
    this.startPosition.y = pointer.y

    this.isSelecting = true

    this.workspace.selectNode([])

    if (e.evt.button === 0) {
      document.addEventListener('pointermove', this.handlePointermove, false)
      document.addEventListener('pointerup', this.handlePointerup, false)
    }
  }

  private handlePointermove = (e: any) => {
    if (!this.isSelecting) {
      return
    }

    this.workspace.cursor = 'default'

    const { left, top } = this.workspace.container.getBoundingClientRect()

    const { x: x1, y: y1 } = this.startPosition

    /**
     * Mousemove is Document listening.
     * Use `clientX / clientY`, prevent the mouse from leaving the canvas.
     */
    const x2 = e.clientX - left
    const y2 = e.clientY - top

    this.selection.setAttrs({
      visible: true,
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    })

    this.checkAndSelect()
  }

  private handlePointerup = () => {
    this.isSelecting = false

    this.workspace.cursor = 'default'

    this.selection.setAttrs({
      visible: false,
    })

    document.removeEventListener('pointermove', this.handlePointermove, false)
    document.removeEventListener('pointerup', this.handlePointerup, false)
  }

  private checkAndSelect = throttle(() => {
    if (!this.workspace.nodes.length) {
      return
    }

    const rect = this.selection.getClientRect()

    const selectedNodes = this.workspace.nodes.filter((node) => {
      if (node instanceof GladeLine) {
        const points = node.points()
        const transform = node.getAbsoluteTransform()
        const matrix = transform.getMatrix()
        return isRectContainsLine(rect, points, matrix)
      }

      return isRectAContainsRectB(rect, node.getClientRect())
    })

    selectedNodes.length && this.workspace.selectNode(selectedNodes)
  }, 80)
}

/**
 * Check RectA contains RectB
 * @param rectA
 * @param rectB
 * @returns boolean
 */
export function isRectAContainsRectB(rectA: IRect, rectB: IRect) {
  const aLeft = rectA.x
  const aRight = rectA.x + rectA.width
  const aTop = rectA.y
  const aBottom = rectA.y + rectA.height

  const bLeft = rectB.x
  const bRight = rectB.x + rectB.width
  const bTop = rectB.y
  const bBottom = rectB.y + rectB.height

  return (
    bLeft >= aLeft
    && bRight <= aRight
    && bTop >= aTop
    && bBottom <= aBottom
  )
}

/**
 * Check Rect contains Line
 * @param rect
 * @param points - Line points
 * @param matrix - Line matrix
 * @returns boolean
 */
export function isRectContainsLine(rect: IRect, points: number[], matrix: number[]) {
  const rectLeft = rect.x
  const rectRight = rect.x + rect.width
  const rectTop = rect.y
  const rectBottom = rect.y + rect.height

  const interval = 4

  for (let i = 0; i < points.length; i += 2 * interval) {
    const x = points[i]
    const y = points[i + 1]

    const transformedX = matrix[0] * x + matrix[2] * y + matrix[4]
    const transformedY = matrix[1] * x + matrix[3] * y + matrix[5]

    if (
      transformedX < rectLeft
      || transformedX > rectRight
      || transformedY < rectTop
      || transformedY > rectBottom
    ) {
      return false
    }
  }

  return true
}
