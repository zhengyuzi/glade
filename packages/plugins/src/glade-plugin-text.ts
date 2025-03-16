import type { GladePlugin, GladeWorkspace } from '@glade-app/core'

export interface GladePluginTextConfig {
  fill?: string
  fontSize?: number
  fontFamily?: string
  opacity?: number
}

export interface GladePluginTextOptions {
  enable?: boolean
  config?: GladePluginTextConfig
}

export interface GladePluginTextCreateEditableOptions {
  x: number
  y: number
  fontFamily: string
  fontSize: number
  text: string
  maxWidth: number
  maxHeight: number
  color: string
  opacity: number
}

export class GladePluginText implements GladePlugin {
  name = 'glade-plugin-text'

  isEnable = false

  private _config: Required<GladePluginTextConfig> = {
    fill: '#000000',
    fontSize: 30,
    fontFamily: 'Arial, sans-serif',
    opacity: 1,
  }

  private editable?: HTMLTextAreaElement

  private currentPosition: { x: number, y: number } | null = null

  constructor(public workspace: GladeWorkspace, options: GladePluginTextOptions = {}) {
    const { enable = false, config } = options

    config && (this._config = { ...this._config, ...config })

    enable && this.enable()
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.workspace.cursor = 'text'
      this.workspace.addEventListener('mousedown', this.handleMousedown)
      this.workspace.container.addEventListener('contextmenu', this.handleContextmenu)
    }
  }

  disable() {
    if (this.isEnable) {
      this.workspace.cursor = 'default'
      this.workspace.removeEventListener('mousedown', this.handleMousedown)
      this.workspace.container.removeEventListener('contextmenu', this.handleContextmenu)
      this.editable?.removeEventListener('input', this.handleEditableInput)
      this.editable?.removeEventListener('blur', this.handleEditableBlur)
      this.workspace.removeEventListener('mousedown', this.editableBlur)
      this.isEnable = false
    }
  }

  destroy() {
    this.disable()
    this.editable = undefined
    this.currentPosition = null
  }

  config(config?: GladePluginTextConfig) {
    if (config) {
      this._config = { ...this._config, ...config }
    }
    return this._config
  }

  private handleContextmenu = (e: any) => e.preventDefault()

  private handleMousedown = (e: any) => {
    if (this.editable) {
      return
    }

    this.currentPosition = this.workspace.pointerPosition

    const { fontSize, fontFamily, fill, opacity } = this._config

    this.editable = createEditable({
      text: '',
      x: e.evt.x,
      y: e.evt.y,
      fontSize: fontSize * this.workspace.zoom,
      fontFamily,
      maxHeight: this.workspace.height - e.evt.y,
      maxWidth: this.workspace.width - e.evt.x,
      color: fill,
      opacity,
    })

    this.workspace.container.appendChild(this.editable)

    setTimeout(() => this.editable?.focus(), 0)
    // this.workspace.addEventListener('mousedown', this.editableBlur)
    this.editable.addEventListener('input', this.handleEditableInput)
    this.editable.addEventListener('blur', this.handleEditableBlur)
  }

  private editableBlur = () => {
    this.editable?.blur()
    this.editable?.removeEventListener('input', this.handleEditableInput)
    this.workspace.removeEventListener('mousedown', this.editableBlur)
  }

  private handleEditableBlur = () => {
    if (!this.editable) {
      return
    }

    this.workspace.container.removeChild(this.editable)

    if (this.editable.value.trim()) {
      const { fontSize, fontFamily, fill, opacity } = this._config
      const { x, y } = this.currentPosition!

      const node = this.workspace.createNode('GladeText', {
        x,
        y,
        text: this.editable.value,
        fontSize,
        fontFamily,
        opacity,
        fill,
      })

      this.workspace.addNode(node)
    }

    this.editable.removeEventListener('blur', this.handleEditableBlur)
    this.editable = undefined
    this.currentPosition = null
  }

  private handleEditableInput = () => {
    if (this.editable) {
      const { fontSize } = this._config
      const content = this.editable.value
      const { width, height } = getTextSize(content, fontSize * this.workspace.zoom)
      this.editable.style.width = `${width}px`
      this.editable.style.height = `${height}px`
    }
  }
}

function createEditable(options: GladePluginTextCreateEditableOptions) {
  const { x, y, fontSize, fontFamily, text, maxHeight, maxWidth, color, opacity } = options

  const editable = document.createElement('textarea')
  editable.value = text

  const { width, height } = getTextSize(text, fontSize)

  Object.assign(editable.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    height: `${height}`,
    maxHeight: `${maxHeight}px`,
    lineHeight: `${fontSize}px`,
    width: `${width}px`,
    maxWidth: `${maxWidth}px`,
    fontSize: `${fontSize}px`,
    color,
    opacity,
    display: 'inline-block',
    fontFamily,
    margin: 0,
    padding: 0,
    border: 0,
    outline: 0,
    resize: 'none',
    background: 'transparent',
    overflow: 'hidden',
    boxSizing: 'content-box',
    whiteSpace: 'pre', // pre-wrap
    wordBreak: 'normal', // break-word
  })

  return editable
}

/**
 * Calc the length and width of text based on font size.
 * Minimum length and width is font size.
 */
function getTextSize(text: string = '', fontSize: number) {
  const rows = text.split('\n')

  /**
   * Get the length of the largest string in the array
   */
  const maxLength = rows.reduce((a, b) => Math.max(a, b.length), 0)

  return {
    width: maxLength * fontSize || fontSize,
    height: rows.length * fontSize || fontSize,
  }
}
