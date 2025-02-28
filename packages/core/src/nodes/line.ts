import type { Context } from 'konva/lib/Context'
import type { Shape } from 'konva/lib/Shape'
import type { LineConfig } from 'konva/lib/shapes/Line'
import type { Vector2d } from 'konva/lib/types'
import { Line } from 'konva/lib/shapes/Line'

export type GladeLineType = 'default' | 'smooth'

export interface GladeLineConfig extends LineConfig {
  lineType?: GladeLineType
}

type LineTypesObj = {
  [key in GladeLineType]: {
    sceneFunc: ((con: Context, shape: Shape) => void) | undefined
  }
}

export class GladeLine extends Line {
  className = 'GladeLine'

  constructor(config: GladeLineConfig) {
    super({
      ...config,
      strokeScaleEnabled: false,
      sceneFunc: getLineType(config.lineType || 'default').sceneFunc,
    })

    this.setAttr('lineType', config.lineType || 'default')
  }
}

function getLineType(type: GladeLineType) {
  const types: LineTypesObj = {
    default: {
      sceneFunc: undefined,
    },
    smooth: {
      sceneFunc(context, shape) {
        context.lineCap = 'round'
        context.lineJoin = 'round'

        const points = (shape as Line).points()

        drawSmoothLine(context, points)

        context.strokeShape(shape)
      },
    },
  }

  return types[type]
}

// Draw smooth line segments
function drawSmoothLine(ctx: Context, segments: number[]) {
  const points = convertArrayToPoints(segments)

  ctx.beginPath()

  if (points.length >= 2) {
    // Smoothed points
    const smoothed = smoothPoints(points, 2)

    ctx.moveTo(smoothed[0].x, smoothed[0].y)

    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = smoothed[Math.max(i - 1, 0)]
      const p1 = smoothed[i]
      const p2 = smoothed[i + 1]
      const p3 = smoothed[Math.min(i + 2, smoothed.length - 1)]

      for (let t = 0; t <= 1; t += 0.05) {
        const point = catmullRom(p0, p1, p2, p3, t)
        ctx.lineTo(point.x, point.y)
      }
    }
  }
  // Points of line segment < 2
  else {
    const index = points.length - 1
    ctx.lineTo(points[index].x, points[index].y)
  }

  ctx.stroke()
}

/**
 * Moving Average Smoothing Algorithm
 */
function smoothPoints(points: Vector2d[], smoothRadius = 2) {
  if (points.length <= smoothRadius)
    return points

  const smoothed: Vector2d[] = []

  for (let i = 0; i < points.length; i++) {
    let sumX = 0
    let sumY = 0
    let count = 0

    for (let j = -smoothRadius; j <= smoothRadius; j++) {
      const index = i + j

      if (index >= 0 && index < points.length) {
        sumX += points[index].x
        sumY += points[index].y
        count++
      }
    }

    smoothed.push({
      x: sumX / count,
      y: sumY / count,
    })
  }

  return smoothed
}

/**
 * Catmull-Rom Interpolation Function
 */
function catmullRom(p0: Vector2d, p1: Vector2d, p2: Vector2d, p3: Vector2d, t: number) {
  const t2 = t * t
  const t3 = t2 * t

  return {
    x: 0.5 * ((2 * p1.x)
      + (-p0.x + p2.x) * t
      + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2
      + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y)
      + (-p0.y + p2.y) * t
      + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2
      + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  }
}

function convertArrayToPoints(arr: number[]) {
  const points = []
  for (let i = 0; i < arr.length; i += 2) {
    points.push({ x: arr[i], y: arr[i + 1] })
  }
  return points
}
