import type { GladePlugin, GladeRect, GladeWorkspace } from '@glade/core'
import { GladeLine } from '@glade/core'
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

  selecting = false

  private startPosition = {
    x: 0,
    y: 0,
  }

  private selectionRectangle: GladeRect

  constructor(
    private workspace: GladeWorkspace,
    options: GladePluginSelectionOptions = {},
  ) {
    const {
      enable = false,
      backgroundColor = 'rgba(107, 114, 128, 0.1)',
      borderColor = 'rgb(107, 114, 128)',
    } = options

    this.selectionRectangle = this.workspace.createNode('GladeRect', {
      fill: backgroundColor,
      stroke: borderColor,
      strokeWidth: 1,
      visible: false,
      listening: false,
    })

    this.workspace.addToFrontLayer(this.selectionRectangle)

    enable && this.enable()
  }

  destroy() {
    this.disable()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.workspace.onEvent('mousedown', this.handleMousedown)
      this.workspace.onNodeEvent('mouseover', this.handleMouseover)
      this.workspace.onNodeEvent('mousedown', this.handleNodeClick)
      this.workspace.cursor = 'default'
    }
  }

  disable() {
    if (this.isEnable) {
      this.workspace.offEvent('mousedown', this.handleMousedown)
      this.workspace.offNodeEvent('mouseover', this.handleMouseover)
      this.workspace.offNodeEvent('mouseout', this.handleMouseout)
      this.workspace.offNodeEvent('mousedown', this.handleNodeClick)
      document.removeEventListener('mousemove', this.handleMousemove, false)
      document.removeEventListener('mouseup', this.handleMouseup, false)
      this.isEnable = false
    }
  }

  private handleNodeClick = (e: any) => {
    this.workspace.selectNode([e.target])
  }

  private handleMouseover = () => {
    if (!this.selecting) {
      this.workspace.cursor = 'move'
      this.workspace.onNodeEvent('mouseout', this.handleMouseout)
    }
  }

  private handleMouseout = () => {
    this.workspace.cursor = 'default'
    this.workspace.offNodeEvent('mouseout', this.handleMouseout)
  }

  private handleMousedown = (e: any) => {
    if (e.evt.button !== 0) {
      return
    }

    const pointer = this.workspace.fixedPointerPosition

    if (!pointer) {
      return
    }

    const nodes = this.workspace.getIntersection(pointer)

    if (!nodes?.length) {
      this.startPosition.x = pointer.x
      this.startPosition.y = pointer.y

      this.selecting = true

      this.workspace.selectNode([])

      this.workspace._tr.listening(false)

      document.addEventListener('mousemove', this.handleMousemove, false)
      document.addEventListener('mouseup', this.handleMouseup, false)
    }
  }

  private handleMousemove = (e: any) => {
    if (!this.selecting) {
      return
    }

    const { left, top } = this.workspace.container.getBoundingClientRect()

    const { x: x1, y: y1 } = this.startPosition

    /**
     * Mousemove is Document listening.
     * Use `clientX / clientY`, prevent the mouse from leaving the canvas.
     */
    const x2 = e.clientX - left
    const y2 = e.clientY - top

    this.selectionRectangle.setAttrs({
      visible: true,
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    })

    this._checkAndSelect()
  }

  private handleMouseup = () => {
    this.selecting = false
    this.selectionRectangle.visible(false)
    this.workspace._tr.listening(true)
    this.workspace.cursor = 'default'

    document.removeEventListener('mousemove', this.handleMousemove, false)
    document.removeEventListener('mouseup', this.handleMouseup, false)
  }

  private _checkAndSelect = throttle(() => {
    if (!this.workspace.getAllNode().length) {
      return
    }

    const rect = this.selectionRectangle.getClientRect()
    const selectedNodes = this.workspace.getAllNode((node) => {
      if (node instanceof GladeLine) {
        const points = node.points()
        const transform = node.getAbsoluteTransform()
        const matrix = transform.getMatrix()
        return isRectContainsLine(rect, points, matrix)
      }

      const shapeRect = node.getClientRect()
      return isRectAContainsRectB(rect, shapeRect)
    })

    this.workspace.selectNode(selectedNodes)
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
