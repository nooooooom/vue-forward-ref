import { getCurrentInstance, h, isRef, VNode } from 'vue'
import { setRef } from './createForwardRef'
import { ComponentInternalInstance, ComponentType } from './types'
import { getVNode, getVNodeRef, isFunction, isString, isVue2, setVNodeRef } from './utils'

/**
 * Make inner component inherits the wrapper's ref owner
 */
export function forwardRef(component: ComponentType, instance = getCurrentInstance()) {
  if (!instance) {
    throw new Error(`forwardRef is used without current active component instance.`)
  }

  return createInnerComponent(component, instance)
}

function createInnerComponent(component: ComponentType, parent: ComponentInternalInstance) {
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

  let vnode: VNode | undefined = undefined
  if (isVue2 && typeof component === 'object') {
    // @ts-ignore: Vue2's `h` doesn't process vnode
    const emptyVNode = h()
    if (component instanceof emptyVNode.constructor) vnode = component as VNode
    if (!vnode) vnode = h(component as any)
  } else {
    vnode = h(component as any)
  }

  const rawRef = getVNodeRef(vnode)
  if (rawRef) {
    setVNodeRef(
      vnode,
      normalizeVNodeRef((refValue: any) => {
        setRef(rawRef, null, refValue, vnode)
        doSet(refValue)
      }, parent)
    )
  } else {
    setVNodeRef(vnode, normalizeVNodeRef(doSet, parent))
  }

  return vnode
}

function normalizeVNodeRef(ref: any, instance: ComponentInternalInstance) {
  if (isVue2) return ref
  return ref != null
    ? isString(ref) || isRef(ref) || isFunction(ref)
      ? { i: instance, r: ref, k: undefined, f: false }
      : ref
    : null
}
