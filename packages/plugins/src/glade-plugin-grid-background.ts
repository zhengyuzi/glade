import type { GladeGroup, GladePlugin, GladeWorkspace } from '@glade/core'

export interface GladePluginGridBackgroundOptions {
  /**
   * Grid size. Default: 20.
   */
  size?: number
  /**
   * Grid border color. Default: #e9e9e9.
   */
  borderColor?: string

  enable?: boolean
}

export class GladePluginGridBackground implements GladePlugin {
  name = 'glade-plugin-grid-background'

  isEnable = false

  grid: GladeGroup

  size: number

  borderColor: string

  constructor(
    private workspace: GladeWorkspace,
    options: GladePluginGridBackgroundOptions = {},
  ) {
    const {
      size = 20,
      borderColor = '#e9e9e9',
      enable = false,
    } = options

    this.size = size
    this.borderColor = borderColor

    this.grid = this.workspace.createNode('GladeGroup', {
      clipX: 0,
      clipY: 0,
    })

    this.workspace.addToBackLayer(this.grid)

    this.grid.moveToBottom()

    enable && this.enable()
  }

  destroy() {
    this.disable()
    this.grid.remove()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.createGrid()
      this.workspace.on('update-view', this.createGrid)
    }
  }

  disable() {
    if (this.isEnable) {
      this.clear()
      this.workspace.off('update-view', this.createGrid)
      this.isEnable = false
    }
  }

  clear() {
    while (this.grid.getChildren().length > 0) {
      this.grid.getChildren()[0].remove()
    }
  }

  createGrid = () => {
    this.clear()

    const { width, height, x: workspaceX, y: workspaceY, zoom } = this.workspace

    this.grid.setAttrs({
      clipWidth: width,
      clipHeight: height,
    })

    const size = this.size * zoom

    const columns = Math.ceil(width / size)
    const rows = Math.ceil(height / size)

    const moveX = workspaceX % size
    const moveY = workspaceY % size

    const offsetX = moveX - size
    const offsetY = moveY - size

    for (let x = 0; x <= columns; x++) {
      const lineX = x * size + moveX
      const isMainLine = Math.round(lineX - workspaceX) % (size * 5) === 0

      if (zoom < 0.5 && !isMainLine) {
        continue
      }

      const line = this.workspace.createNode('GladeLine', {
        points: [
          Math.floor(lineX) + 0.5,
          Math.floor(offsetY) + 0.5,
          Math.floor(lineX) + 0.5,
          Math.floor(height - offsetY) + 0.5,
        ],
        stroke: this.borderColor,
        strokeWidth: 1,
        listening: false,
        dash: isMainLine ? [] : [3, 3],
      })

      this.grid.add(line)
    }

    for (let y = 0; y <= rows; y++) {
      const lineY = y * size + moveY
      const isMainLine = Math.round(lineY - workspaceY) % (size * 5) === 0

      if (zoom < 0.5 && !isMainLine) {
        continue
      }

      const line = this.workspace.createNode('GladeLine', {
        points: [
          Math.floor(offsetX) + 0.5,
          Math.floor(lineY) + 0.5,
          Math.floor(width - offsetX) + 0.5,
          Math.floor(lineY) + 0.5,
        ],
        stroke: this.borderColor,
        strokeWidth: 1,
        listening: false,
        dash: isMainLine ? [] : [3, 3],
      })

      this.grid.add(line)
    }
  }
}
