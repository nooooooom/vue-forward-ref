import { getCurrentInstance, h, version, VNode } from 'vue'
import { ComponentInternalInstance } from './types'

const isVue2 = +version.split('.')[0] !== 3

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

function createInnerComponent(component: ComponentType, parent: ComponentInternalInstance) {
  const vnode = h(component)
  if (isVue2) {
    const { ref } = (parent.vnode as any).data
    ;(vnode as any).data.ref = ref
  } else {
    const { ref } = parent.vnode
    vnode.ref = ref
  }

  return vnode
}
