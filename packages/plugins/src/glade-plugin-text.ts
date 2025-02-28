import type { GladePlugin, GladeText, GladeWorkspace } from '@glade/core'

export interface GladePluginTextCreateTextAreaOptions {
  x: number
  y: number
  fontFamily: string
  fontSize: number
  value: string
  maxWidth: number
  maxHeight: number
}

export interface GladePluginTextOptions {
  enable?: boolean
}

export class GladePluginText implements GladePlugin {
  name = 'glade-plugin-text'

  isEnable = false

  private currentText?: GladeText

  private currentEditable?: HTMLTextAreaElement

  constructor(public workspace: GladeWorkspace, options: GladePluginTextOptions = {}) {
    const { enable = false } = options
    enable && this.enable()
  }

  destroy() {
    this.disable()
    this.currentText = undefined
    this.currentEditable = undefined
  }

  enable() {
    if (!this.isEnable) {
      this.isEnable = true
      this.workspace.cursor = 'text'
      this.workspace.onEvent('mousedown', this.handleMousedown)
      this.workspace.container.addEventListener('contextmenu', this.handleContextmenu)
    }
  }

  disable() {
    if (this.isEnable) {
      this.isEnable = false
      this.workspace.cursor = 'default'
      this.workspace.offEvent('mousedown', this.handleMousedown)
      this.workspace.container.removeEventListener('contextmenu', this.handleContextmenu)
    }
  }

  private handleContextmenu = (e: any) => e.preventDefault()

  private handleMousedown = (e: any) => {
    const point = this.workspace.pointerPosition
    const fixedPoint = this.workspace.fixedPointerPosition
    const fontSize = 30

    if (this.currentEditable || !point || !fixedPoint) {
      return
    }

    this.currentEditable = createEditable({
      value: '',
      x: e.evt.x,
      y: e.evt.y,
      fontSize: fontSize * this.workspace.zoom,
      fontFamily: `Calibri`,
      maxHeight: this.workspace.height - e.evt.y,
      maxWidth: this.workspace.width - e.evt.x,
    })

    this.workspace.container.appendChild(this.currentEditable)

    const waitInputLoad = setTimeout(() => {
      this.currentEditable?.focus()
      clearTimeout(waitInputLoad)
    }, 0)

    this.workspace.onEvent('mousedown', this.handleEditableBlur)

    this.currentEditable.addEventListener('input', () => {
      if (this.currentEditable) {
        const content = this.currentEditable.value
        const { width, height } = getTextSize(content, fontSize * this.workspace.zoom)
        this.currentEditable.style.width = `${width}px`
        this.currentEditable.style.height = `${height}px`
      }
    })

    this.currentEditable.addEventListener('blur', () => {
      if (this.currentEditable) {
        this.workspace.container.removeChild(this.currentEditable)

        if (this.currentEditable.value.trim()) {
          this.currentText = this.workspace.createNode('GladeText', {
            x: point.x,
            y: point.y,
            text: this.currentEditable?.value,
            fontSize,
            fontFamily: `Calibri`,
            fill: '#000',
          })

          this.workspace.addNode(this.currentText)
        }

        this.currentEditable = undefined

        this.workspace.offEvent('mousedown', this.handleEditableBlur)
      }
    })
  }

  private handleEditableBlur = () => {
    this.currentEditable?.blur()
  }
}

export function createEditable(options: GladePluginTextCreateTextAreaOptions) {
  const { x, y, fontSize, fontFamily, value, maxHeight, maxWidth } = options

  const editable = document.createElement('textarea')
  editable.value = value

  const { width, height } = getTextSize(value, fontSize)

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
export function getTextSize(text: string = '', fontSize: number) {
  const rows = text.split('\n')

  /**
   * Get the length of the largest string in the array
   */
  const maxLength = rows.reduce((a, b) => {
    return Math.max(a, b.length)
  }, 0)

  return {
    width: maxLength * fontSize || fontSize,
    height: rows.length * fontSize || fontSize,
  }
}
