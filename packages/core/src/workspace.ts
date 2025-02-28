import type { GladeEvents, GladeNode, GladeNodeConfig, GladeNodeObj, GladeWorkspaceOptions } from './types'
import EventEmitter from 'eventemitter3'
import Konva from 'konva'
import { nanoid } from 'nanoid'
import { GladeGroup, GladeImage, GladeLine, GladeRect, GladeText } from './nodes'
import { GladeTransformer } from './transformer'

export class GladeWorkspace extends EventEmitter<GladeEvents> {
  _stage: Konva.Stage

  _layer: Konva.Layer

  _backLayer: Konva.Layer

  _frontLayer: Konva.Layer

  _tr: GladeTransformer

  isPointerDown = false

  constructor(container: string | HTMLDivElement, options: GladeWorkspaceOptions = {}) {
    super()

    const { zoom, position, nodes } = options

    const el = typeof container === 'string' ? document.querySelector(container) : container

    const transformMove = {
      x: 0,
      y: 0,
    }

    this._stage = new Konva.Stage({
      container,
      width: el?.clientWidth,
      height: el?.clientHeight,
    })

    this._layer = new Konva.Layer()

    this._backLayer = new Konva.Layer()

    this._frontLayer = new Konva.Layer()

    this._tr = new GladeTransformer({
      fill: 'rgba(107, 114, 128, 0.1)',
      borderStroke: 'rgb(107, 114, 128)',
      anchorStroke: 'rgb(107, 114, 128)',
      borderDash: [5, 5],
    })

    this._frontLayer.add(this._tr)
    this._stage.add(this._backLayer, this._layer, this._frontLayer)

    if (zoom) {
      this._layer.scale({
        x: zoom,
        y: zoom,
      })
    }

    if (position) {
      this._layer.position(position)
    }

    if (nodes) {
      const _nodes = this.loadNode(nodes)
      this.addNode(_nodes)
    }

    this._stage.on('pointerdown', () => {
      this.isPointerDown = true
    })

    document.addEventListener('pointerup', () => {
      this.isPointerDown = false
    })

    this._tr.mask.on('pointerclick', (e: Konva.KonvaEventObject<any>) => {
      if (e.evt.button !== 2) {
        this.selectNode([])
      }
    })
    this._tr.mask.on('mouseenter', () => this.cursor = 'move')
    this._tr.mask.on('mouseleave', () => this.cursor = 'default')

    this._tr.on('transform', () => this._callNodeEvent('node:transform'))
    this._tr.on('transformstart', (e: Konva.KonvaEventObject<any>) => {
      transformMove.x = e.evt.x
      transformMove.y = e.evt.y
      this._callNodeEvent('node:transformstart')
    })
    this._tr.on('transformend', (e: Konva.KonvaEventObject<any>) => {
      if (e.evt.x !== transformMove.x || e.evt.y !== transformMove.y) {
        this._callNodeEvent('node:transformend')
      }
    })
    this._tr.on('dragmove', () => this._callNodeEvent('node:move'))
    this._tr.on('dragstart', () => this._callNodeEvent('node:movestart'))
    this._tr.on('dragend', () => this._callNodeEvent('node:moveend'))
  }

  private _callNodeEvent = (hookType: keyof GladeEvents, nodes: GladeNode[] = this.selectedNodes) => {
    return this.emit(hookType, {
      type: hookType,
      nodes,
    })
  }

  private _callViewEvent = () => {
    return this.emit('update-view', {
      type: 'update-view',
      value: {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        zoom: this.zoom,
      },
    })
  }

  get container() {
    return this._stage.container()
  }

  get cursor() {
    return this.container.style.cursor
  }

  set cursor(value: CSSStyleDeclaration['cursor']) {
    this.container.style.cursor = value
  }

  get zoom() {
    return this._layer.scaleX()
  }

  set zoom(value: number) {
    const center = {
      x: this.width / 2,
      y: this.height / 2,
    }

    const relatedTo = {
      x: (center.x - this.x) / this.zoom,
      y: (center.y - this.y) / this.zoom,
    }

    this.position = {
      x: center.x - relatedTo.x * value,
      y: center.y - relatedTo.y * value,
    }

    this._layer.scale({
      x: value,
      y: value,
    })

    this._layer.draw()

    this._callViewEvent()
  }

  get width() {
    return this._stage.width()
  }

  get height() {
    return this._stage.height()
  }

  set width(value) {
    this._stage.width(value)
    this._callViewEvent()
  }

  set height(value) {
    this._stage.height(value)
    this._callViewEvent()
  }

  get size() {
    return this._stage.getSize()
  }

  set size(value) {
    this._stage.setSize(value)
    this._callViewEvent()
  }

  get x() {
    return this._layer.x()
  }

  set x(value) {
    this._layer.x(value)
    this._callViewEvent()
  }

  get y() {
    return this._layer.y()
  }

  set y(value) {
    this._layer.y(value)
    this._callViewEvent()
  }

  get position() {
    return this._layer.position()
  }

  set position(position) {
    this._layer.position(position)
    this._callViewEvent()
  }

  /**
   * Get the pointer position after canvas offset and scaling
   */
  get pointerPosition() {
    const pointer = this._stage.getPointerPosition()

    return pointer && {
      x: (pointer.x - this.x) / this.zoom,
      y: (pointer.y - this.y) / this.zoom,
    }
  }

  /**
   * Get pointer position, ignoring canvas offset and scaling
   */
  get fixedPointerPosition() {
    return this._stage.getPointerPosition()
  }

  get selectedNodes() {
    return this._tr.nodes() as GladeNode[]
  }

  onEvent(evtStr: string | number, handler: Konva.KonvaEventListener<Konva.Stage, any>) {
    return this._stage.on(evtStr, handler)
  }

  offEvent(evtStr?: string, callback?: (...arg: any) => void) {
    return this._stage.off(evtStr, callback)
  }

  onNodeEvent(evtStr: string | number, handler: Konva.KonvaEventListener<Konva.Layer, any>) {
    return this._layer.on(evtStr, handler)
  }

  offNodeEvent(evtStr?: string, callback?: (...arg: any) => void) {
    return this._layer.off(evtStr, callback)
  }

  /**
   * Get visible intersection node.
   * @pos Vector2d
   * @return GladeNode | null
   */
  getIntersection(pos: Konva.Vector2d) {
    const target = this._layer.getIntersection(pos) as GladeNode | null

    if (target) {
      return [target]
    }

    const stageTarget = this._stage.getIntersection(pos) as GladeNode | null

    if (stageTarget && this._tr.isTransformerNode(stageTarget)) {
      return this.selectedNodes
    }
  }

  getNode(id: string) {
    return this._layer.findOne<GladeNode>(`#${id}`)
  }

  /**
   * @param arr any[]
   * @param callback (item) => id
   * @returns nodes
   */
  getNodes<T>(arr: T[], callback?: (item: T) => string) {
    const nodes: GladeNode[] = []

    arr.forEach((item) => {
      const id = callback?.(item) || item

      if (typeof id === 'string') {
        const node = this.getNode(id)
        node && nodes.push(node)
      }
    })

    return nodes
  }

  getAllNode(callback?: (node: GladeNode) => boolean) {
    const children = this._layer.children as GladeNode[]

    if (callback) {
      return children.filter(node => callback ? callback(node) : true)
    }

    return children
  }

  createNode<T extends keyof GladeNodeConfig>(gladeNodeType: T, config: GladeNodeConfig[T] = {}) {
    const nodes = {
      GladeLine,
      GladeRect,
      GladeText,
      GladeImage,
      GladeGroup,
    }

    const NodeClass = nodes[gladeNodeType]
    return new NodeClass(config) as InstanceType<typeof NodeClass>
  }

  addNode(_node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_node) ? _node : [_node]

    if (!nodes.length) {
      return
    }

    for (const node of nodes) {
      if (!node) {
        continue
      }

      const id = node.id()

      if (!id || this.getNode(id)) {
        node.id(nanoid())
      }

      this._layer.add(node)
    }

    this.isPointerDown
      ? document.addEventListener('pointerup', () => this._callNodeEvent('node:add', nodes), { once: true })
      : this._callNodeEvent('node:add', nodes)
  }

  removeNode(_node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_node) ? _node : [_node]

    if (!nodes.length) {
      return
    }

    const selectedNodes = [...this.selectedNodes]

    for (const node of nodes) {
      if (!node) {
        continue
      }

      const index = selectedNodes.indexOf(node)

      if (index !== -1) {
        selectedNodes.splice(index, 1)
      }

      node.remove()
    }

    this._tr.nodes(selectedNodes)

    this._callNodeEvent('node:remove', nodes)
  }

  selectNode(_node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_node) ? _node : [_node]
    const currentNodes = [...this.selectedNodes]

    // Check if passed nodes match the selected nodes
    const isSameSelected = currentNodes.length === nodes.length && currentNodes.some(item => nodes.includes(item))

    if (isSameSelected) {
      return currentNodes
    }

    this._tr.nodes(nodes)

    if (nodes.length) {
      this._callNodeEvent('node:select', nodes)
    }
    else {
      currentNodes.length && this._callNodeEvent('node:cancel-select', currentNodes)
    }
  }

  objectNode(_node: GladeNode | GladeNode[]): GladeNodeObj[] {
    const nodes = Array.isArray(_node) ? _node : [_node]

    if (!nodes.length) {
      return []
    }

    this._callNodeEvent('node:object', nodes)

    const selectedNodes = this.selectedNodes

    const object: GladeNodeObj[] = nodes.map((node) => {
      return {
        ...node.toObject() as GladeNodeObj,
        isSelect: selectedNodes.includes(node),
        zIndex: node.zIndex(),
      }
    })

    return object
  }

  loadNode(_nodes: GladeNodeObj[]) {
    const nodes = _nodes.map((item) => {
      const n = this.createNode(item.className, item.attrs)

      if (item.isSelect) {
        this._tr.nodes([...this.selectedNodes, n])
      }

      return n
    })

    this._callNodeEvent('node:load', nodes)

    return nodes
  }

  sendBackward(node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(node) ? [...new Set(node)] : [node]

    if (!nodes.length) {
      return
    }

    nodes.sort((a, b) => a.zIndex() - b.zIndex())

    const zIndexs = nodes.map(node => node.zIndex())

    const movedNodes = nodes.filter((node, index) => {
      if (zIndexs[index] === index) {
        return false
      }

      node.moveDown()

      return zIndexs[index] !== node.zIndex()
    })

    if (movedNodes.length) {
      this._callNodeEvent('node:send-backward', movedNodes)
    }
  }

  sendToBack(node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(node) ? [...new Set(node)] : [node]

    if (!nodes.length) {
      return
    }

    nodes.sort((a, b) => b.zIndex() - a.zIndex())

    const zIndexs = nodes.map(node => node.zIndex())

    const currentNodesMaxZIndex = nodes.length - 1

    const movedNodes = nodes.filter((node, index) => {
      node.moveToBottom()

      if (zIndexs[index] === currentNodesMaxZIndex - index) {
        return false
      }

      return zIndexs[index] !== node.zIndex()
    })

    if (movedNodes.length) {
      this._callNodeEvent('node:send-to-back', movedNodes)
    }
  }

  bringForward(node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(node) ? [...new Set(node)] : [node]

    if (!nodes.length) {
      return
    }

    const maxZIndex = this._layer.children.length - 1

    nodes.sort((a, b) => b.zIndex() - a.zIndex())

    const zIndexs = nodes.map(node => node.zIndex())

    const movedNodes = nodes.filter((node, index) => {
      if (maxZIndex - index === zIndexs[index]) {
        return false
      }

      node.moveUp()

      return zIndexs[index] !== node.zIndex()
    })

    if (movedNodes.length) {
      this._callNodeEvent('node:bring-forward', movedNodes)
    }
  }

  bringToFront(node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(node) ? [...new Set(node)] : [node]

    if (!nodes.length) {
      return
    }

    nodes.sort((a, b) => a.zIndex() - b.zIndex())

    const zIndexs = nodes.map(node => node.zIndex())

    const maxZIndex = this._layer.children.length - 1
    const currentNodesMaxZIndex = nodes.length - 1

    const movedNodes = nodes.filter((node, index) => {
      node.moveToTop()

      if (zIndexs[index] === maxZIndex - currentNodesMaxZIndex + index) {
        return false
      }

      return zIndexs[index] !== node.zIndex()
    })

    if (movedNodes.length) {
      this._callNodeEvent('node:bring-to-front', movedNodes)
    }
  }

  addToBackLayer(node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(node) ? node : [node]

    for (const node of nodes) {
      // Set node id
      !node.id() && node.id(nanoid())
    }

    this._backLayer.add(...nodes)
  }

  addToFrontLayer(node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(node) ? node : [node]

    for (const node of nodes) {
      // Set node id
      !node.id() && node.id(nanoid())
    }

    this._frontLayer.add(...nodes)
  }

  destroy() {
    this._stage.destroy()
    this.removeAllListeners()
  }
}
