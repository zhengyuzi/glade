import type Konva from 'konva'
import type { GladeCore } from './core'
import type { GladeAddNodeOptions, GladeEventObject, GladeHooks, GladeNode, GladeNodeConfig, GladeNodeObj, GladeObjectNodeOptions, GladeOnEventOptions, GladeWorkspaceOptions } from './types'
import EventEmitter from 'eventemitter3'
import { nanoid } from 'nanoid'
import { GladeGroup, GladeImage, GladeLine, GladeRect, GladeText } from './nodes'

export class GladeWorkspace extends EventEmitter<GladeHooks> {
  private view: GladeCore

  private handlerWrappers = new Map<
    (e: GladeEventObject<any, Konva.Layer | Konva.Stage>) => void,
    (e: Konva.KonvaEventObject<Konva.Layer>) => void
  >()

  isPointerDown = false

  constructor(view: GladeCore, options: GladeWorkspaceOptions = {}) {
    super()

    this.view = view

    const { zoom, position, nodes } = options

    const transformMove = { x: 0, y: 0 }

    zoom && view.canvas.scale({ x: zoom, y: zoom })
    position && view.canvas.position(position)

    if (nodes) {
      const _nodes = this.loadNode(nodes)
      this.addNode(_nodes)
    }

    view.stage.on('pointerdown', () => this.isPointerDown = true)
    document.addEventListener('pointerup', () => this.isPointerDown = false)

    view.transformer._node.mask.on('pointerclick', (e: Konva.KonvaEventObject<any>) => {
      if (e.evt.button !== 2) {
        this.selectNode([])
        this.cursor = 'default'
      }
    })
    view.transformer._node.mask.on('mouseenter', () => this.cursor = 'move')
    view.transformer._node.mask.on('mouseleave', () => this.cursor = 'default')

    view.transformer._node.on('transform', () => this.callHook('node:transform'))
    view.transformer._node.on('transformstart', (e: Konva.KonvaEventObject<any>) => {
      transformMove.x = e.evt.x
      transformMove.y = e.evt.y
      this.callHook('node:transformstart')
    })
    view.transformer._node.on('transformend', (e: Konva.KonvaEventObject<any>) => {
      if (e.evt.x !== transformMove.x || e.evt.y !== transformMove.y) {
        this.callHook('node:transformend')
      }
    })
    view.transformer._node.on('dragmove', () => this.callHook('node:move'))
    view.transformer._node.on('dragstart', () => this.callHook('node:movestart'))
    view.transformer._node.on('dragend', () => this.callHook('node:moveend'))
  }

  private callHook = (hookType: keyof GladeHooks, nodes: GladeNode[] = this.selectedNodes) => {
    return this.emit(hookType, {
      type: hookType,
      nodes,
    })
  }

  get container() {
    return this.view.stage.container()
  }

  get cursor() {
    return this.container.style.cursor
  }

  set cursor(value: CSSStyleDeclaration['cursor']) {
    this.container.style.cursor = value
  }

  get width() {
    return this.view.stage.width()
  }

  get height() {
    return this.view.stage.height()
  }

  set width(value) {
    this.view.stage.width(value)
    this.emit('view:update')
  }

  set height(value) {
    this.view.stage.height(value)
    this.emit('view:update')
  }

  get size() {
    return this.view.stage.getSize()
  }

  set size(value) {
    this.view.stage.setSize(value)
    this.emit('view:update')
  }

  get x() {
    return this.view.canvas.x()
  }

  set x(value) {
    this.view.canvas.x(value)
    this.emit('view:update')
  }

  get y() {
    return this.view.canvas.y()
  }

  set y(value) {
    this.view.canvas.y(value)
    this.emit('view:update')
  }

  get position() {
    return this.view.canvas.position()
  }

  set position(position) {
    this.view.canvas.position(position)
    this.emit('view:update')
  }

  get zoom() {
    return this.view.canvas.scaleX()
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

    this.view.canvas.scale({
      x: value,
      y: value,
    })

    this.emit('view:update')
  }

  /**
   * Get the pointer position after canvas offset and scaling
   */
  get pointerPosition() {
    const pointer = this.view.stage.getPointerPosition()

    return pointer && {
      x: (pointer.x - this.x) / this.zoom,
      y: (pointer.y - this.y) / this.zoom,
    }
  }

  /**
   * Get pointer position, ignoring canvas offset and scaling
   */
  get fixedPointerPosition() {
    return this.view.stage.getPointerPosition()
  }

  get nodes() {
    return this.view.canvas.gladeNodes
  }

  get selectedNodes() {
    return this.view.transformer.nodes()
  }

  getFlattenedNodes(nodes: GladeNode[]): GladeNode[] {
    return nodes.flatMap(node =>
      node instanceof GladeGroup
        ? this.getFlattenedNodes(node.children)
        : [node],
    )
  }

  getNode(id: string) {
    return this.nodes.find(item => item.id === id)
  }

  /**
   * Get visible intersection node.
   * @pos Vector2d
   * @return GladeNode | null
   */
  getIntersection(pos: Konva.Vector2d) {
    const target = this.view.canvas.getIntersection(pos)

    if (target) {
      let id = target.id()
      let parent = target.parent

      while (parent?.className === 'GladeGroup') {
        id = parent.id()
        parent = parent.parent
      }

      const node = this.getNode(id)

      return node ? [node] : []
    }

    const stageTarget = this.view.stage.getIntersection(pos)

    if (stageTarget && this.view.transformer.isTransformerNode(stageTarget)) {
      return this.selectedNodes
    }

    return null
  }

  addEventListener(
    evtStr: string | number,
    handler: (e: GladeEventObject<Konva.Layer | Konva.Stage, any>) => void,
    options: GladeOnEventOptions = {},
  ) {
    const { onlyNode } = options

    const _handler = (e: Konva.KonvaEventObject<Konva.Layer | Konva.Stage>) => {
      const node = this.getNode(e.target.id())
      handler({ ...e, target: node! })
    }

    this.handlerWrappers.set(handler, _handler)

    if (onlyNode) {
      this.view.canvas.on(evtStr, _handler)
      return
    }

    this.view.stage.on(evtStr, _handler)
  }

  removeEventListener(
    evtStr: string,
    callback: (...arg: any) => void,
    options: GladeOnEventOptions = {},
  ) {
    const { onlyNode } = options

    const _handler = this.handlerWrappers.get(callback)

    if (onlyNode) {
      this.view.canvas.off(evtStr, _handler)
      return
    }

    this.view.stage.off(evtStr, _handler)
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

  addNode(_node: GladeNode | GladeNode[], options: GladeAddNodeOptions = {}) {
    const { layer = 'canvas', select = false } = options

    const nodes = Array.isArray(_node) ? _node : [_node]

    const layers = {
      canvas: this.view.canvas,
      background: this.view.background,
      foreground: this.view.foreground,
    }

    layers[layer].addGladeNode(...nodes)

    select && this.view.transformer.nodes(nodes)

    if (layer === 'canvas') {
      this.isPointerDown
        ? document.addEventListener('pointerup', () => this.callHook('node:add', nodes), { once: true })
        : this.callHook('node:add', nodes)
    }
  }

  removeNode(_node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_node) ? _node : [_node]

    const selectedNodes = [...this.selectedNodes]

    if (!nodes.length) {
      return
    }

    for (const node of nodes) {
      const index = selectedNodes.indexOf(node)

      if (index !== -1) {
        selectedNodes.splice(index, 1)
      }

      this.view.canvas.removeGladeNode(node)
    }

    this.callHook('node:remove', nodes)

    this.view.transformer.nodes(selectedNodes)
  }

  selectNode(_node: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_node) ? _node : [_node]
    const currentNodes = this.selectedNodes

    // Check if passed nodes match the selected nodes
    const isSameSelected = currentNodes.length === nodes.length && currentNodes.some(item => nodes.includes(item))

    if (isSameSelected) {
      return currentNodes
    }

    this.view.transformer.nodes(nodes)

    if (nodes.length) {
      this.callHook('node:select', nodes)
    }
    else {
      currentNodes.length && this.callHook('node:cancel-select', currentNodes)
    }
  }

  objectNode(_node: GladeNode | GladeNode[], options: GladeObjectNodeOptions = {}) {
    const { dataURL = false } = options

    const nodes = Array.isArray(_node) ? _node : [_node]

    this.callHook('node:object', nodes)

    const object: GladeNodeObj[] = nodes.map((node) => {
      const nodeObj = node._node.toObject() as GladeNodeObj

      if (dataURL && node instanceof GladeImage) {
        nodeObj.attrs = { ...nodeObj.attrs, dataURL: node.dataURL }
      }

      return {
        ...nodeObj,
        isSelect: this.selectedNodes.some(item => item.id === node.id),
        zIndex: node._node.zIndex(),
      }
    })

    return object
  }

  loadNode(_nodes: GladeNodeObj[]) {
    const selectedNodes: GladeNode[] = []

    const processNodes = (nodes: GladeNodeObj[]): GladeNode[] => {
      return nodes.map((item) => {
        const id = item.attrs.id
        const isExist = !!this.getNode(id)

        const n = this.createNode(item.className, {
          ...item.attrs,
          id: !id && isExist ? nanoid() : id,
        })

        if (n instanceof GladeGroup && item.children) {
          const children = processNodes(item.children)
          n.add(...children)
        }
        else if (n instanceof GladeImage && n.dataURL) {
          n.setAttrs({ dataURL: undefined })
        }

        if (item.isSelect && !isExist) {
          selectedNodes.push(n)
        }

        return n
      })
    }

    const nodes = processNodes(_nodes)

    if (selectedNodes.length > 0) {
      this.view.transformer.nodes(selectedNodes)
    }

    this.callHook('node:load', nodes)

    return nodes
  }

  sendNodeBackward(_nodes: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_nodes) ? [...new Set(_nodes)] : [_nodes]

    if (!nodes.length) {
      return
    }

    nodes.sort((a, b) => a._node.zIndex() - b._node.zIndex())

    const zIndexs = nodes.map(node => node._node.zIndex())

    const movedNodes = nodes.filter((node, index) => {
      if (zIndexs[index] === index) {
        return false
      }

      node._node.moveDown()

      return zIndexs[index] !== node._node.zIndex()
    })

    if (movedNodes.length) {
      this.callHook('node:backward', movedNodes)
    }
  }

  sendNodeToBack(_nodes: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_nodes) ? [...new Set(_nodes)] : [_nodes]

    if (!nodes.length) {
      return
    }

    nodes.sort((a, b) => b._node.zIndex() - a._node.zIndex())

    const zIndexs = nodes.map(node => node._node.zIndex())

    const currentNodesMaxZIndex = nodes.length - 1

    const movedNodes = nodes.filter((node, index) => {
      node._node.moveToBottom()

      if (zIndexs[index] === currentNodesMaxZIndex - index) {
        return false
      }

      return zIndexs[index] !== node._node.zIndex()
    })

    if (movedNodes.length) {
      this.callHook('node:to-back', movedNodes)
    }
  }

  bringNodeForward(_nodes: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_nodes) ? [...new Set(_nodes)] : [_nodes]

    if (!nodes.length) {
      return
    }

    const maxZIndex = this.nodes.length - 1

    nodes.sort((a, b) => b._node.zIndex() - a._node.zIndex())

    const zIndexs = nodes.map(node => node._node.zIndex())

    const movedNodes = nodes.filter((node, index) => {
      if (maxZIndex - index === zIndexs[index]) {
        return false
      }

      node._node.moveUp()

      return zIndexs[index] !== node._node.zIndex()
    })

    if (movedNodes.length) {
      this.callHook('node:forward', movedNodes)
    }
  }

  bringNodeToFront(_nodes: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_nodes) ? [...new Set(_nodes)] : [_nodes]

    if (!nodes.length) {
      return
    }

    nodes.sort((a, b) => a._node.zIndex() - b._node.zIndex())

    const zIndexs = nodes.map(node => node._node.zIndex())

    const maxZIndex = this.nodes.length - 1
    const currentNodesMaxZIndex = nodes.length - 1

    const movedNodes = nodes.filter((node, index) => {
      node._node.moveToTop()

      if (zIndexs[index] === maxZIndex - currentNodesMaxZIndex + index) {
        return false
      }

      return zIndexs[index] !== node._node.zIndex()
    })

    if (movedNodes.length) {
      this.callHook('node:to-front', movedNodes)
    }
  }

  updateNode(_nodes: GladeNode | GladeNode[], attrs: Record<string, any>) {
    const nodes = Array.isArray(_nodes) ? [...new Set(_nodes)] : [_nodes]

    if (!nodes.length) {
      return
    }

    nodes.forEach(node => node.setAttrs(attrs))

    this.callHook('node:update', nodes)
  }

  group(_nodes: GladeNode | GladeNode[]) {
    const nodes = Array.isArray(_nodes) ? [...new Set(_nodes)] : [_nodes]

    const selectedNodes = [...this.selectedNodes]

    if (!nodes.length) {
      return
    }

    const group = this.createNode('GladeGroup')

    for (const node of nodes) {
      const index = selectedNodes.indexOf(node)

      if (index !== -1) {
        selectedNodes.splice(index, 1)
      }

      this.view.canvas.removeGladeNode(node)
      group.add(node)
    }

    this.view.canvas.addGladeNode(group)

    this.view.transformer.nodes([group])

    this.callHook('node:group', [group])
  }

  ungroup(group: GladeGroup) {
    const selectedNodes = this.selectedNodes

    this.view.canvas.removeGladeNode(group)

    const index = selectedNodes.indexOf(group)

    if (index !== -1) {
      selectedNodes.splice(index, 1)
    }

    this.callHook('node:ungroup', [group])

    this.view.canvas.addGladeNode(...group.children)

    this.view.transformer.nodes(selectedNodes)
  }
}
