import { getCurrentInstance, h, nextTick, VNode } from 'vue'
import { setRef } from './createForwardRef'
import { ComponentInternalInstance } from './types'
import { getVNode, getVNodeRef } from './utils'

type ComponentType = typeof h extends (type: infer T, ...args: any[]) => any ? T | VNode : never

/**
 * Make inner component inherits the wrapper's ref owner
 */
export function forwardRef(component: ComponentType, instance = getCurrentInstance()) {
  if (!instance) {
    throw new Error(`createForwardRef is used without current active component instance.`)
  }

  return createInnerComponent(component, instance)
}

function createInnerComponent(component: any, parent: ComponentInternalInstance) {
  let oldRawRef: any = null

  const parentVNode = getVNode(parent)
  // TODO: This may be my understanding is wrong, I should be implemented as this
  // >>> setVNodeRef(vnode, getVNodeRef(parentVNode))
  const vnode = h(component, {
    ref: (refValue) => {
      const rawRef = getVNodeRef(parentVNode)
      void nextTick(() => setRef(rawRef, oldRawRef, refValue, vnode))
    }
  })

  return vnode
}
