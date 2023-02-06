import { getCurrentInstance, h, isRef, VNode } from 'vue'
import { setRef } from './createForwardRef'
import { ComponentInternalInstance } from './types'
import { getVNode, getVNodeRef, isFunction, isString, isVue2, setVNodeRef } from './utils'

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
  if (component === undefined || component === null) {
    return
  }

  const parentVNode = getVNode(parent)
  let oldRawRef: any = null

  const doSet = (refValue: any) => {
    new Promise<void>((resolve) => resolve()).then(() => {
      const rawRef = getVNodeRef(parentVNode)
      setRef(rawRef, oldRawRef, refValue, vnode)
      oldRawRef = rawRef
    })
  }

  const vnode = h(component)
  const rawRef = getVNodeRef(vnode)
  if (rawRef) {
    setVNodeRef(
      vnode,
      normalizeRef((refValue: any) => {
        setRef(rawRef, null, refValue, vnode)
        doSet(refValue)
      }, parent)
    )
  } else {
    setVNodeRef(vnode, normalizeRef(doSet, parent))
  }

  return vnode
}

function normalizeRef(ref: any, instance: ComponentInternalInstance) {
  return ref != null
    ? isString(ref) || isRef(ref) || isFunction(ref)
      ? { i: instance, r: ref, k: undefined, f: false }
      : ref
    : null
}
