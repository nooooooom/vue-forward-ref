import { h, VNode } from 'vue'
import { ComponentType } from './types'
import { compatGetCurrentInstance, isVue2, setRef, waitParentRefSetting } from './utils'

/**
 * Make inner component inherits the parent's ref owner
 */
export function forwardRef(component: ComponentType, instance = compatGetCurrentInstance()) {
  if (!instance) {
    throw new Error(`forwardRef is used without current active component instance.`)
  }

  return createInnerComponent(component, instance)
}

function createInnerComponent(component: ComponentType, parent: any) {
  if (component === undefined || component === null) {
    return
  }

  let vnode: any = undefined
  let oldRawRef: any = null

  const overrideRef = (refValue: any) => {
    const parentRef = isVue2 ? parent.$vnode?.data?.ref : parent.vnode.ref
    waitParentRefSetting().then(() => {
      if (parentRef != null) {
        setRef(
          parentRef,
          oldRawRef,
          refValue,
          parent,
          isVue2 ? (parent as any)._isDestroyed : parent.isUnmounted
        )

        oldRawRef = parentRef
      }
    })
  }

  if (isVue2 && typeof component === 'object') {
    // @ts-ignore: Vue2's `h` doesn't process vnode
    const EmptyVNode = h()
    if (component instanceof EmptyVNode.constructor) {
      vnode = component as VNode
    }
    if (!vnode) {
      vnode = h(component as any)
    }

    ;(vnode.data || (vnode.data = {})).ref = overrideRef

    return vnode
  }

  return (vnode = h(component as any, {
    ref: overrideRef
  }))
}
