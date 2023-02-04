import { getCurrentInstance, h, VNode } from 'vue'
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
  const parentVNode = getVNode(parent)
  let oldRawRef: any = null
  const vnode = h(component, {
    ref: (refValue) => {
      new Promise<void>((resolve) => resolve()).then(() => {
        const rawRef = getVNodeRef(parentVNode)
        setRef(rawRef, oldRawRef, refValue, vnode)
        oldRawRef = rawRef
      })
    }
  })

  return vnode
}
