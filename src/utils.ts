import { version, VNode } from 'vue'
import { ComponentInternalInstance } from './types'

export const isVue2 = +version.split('.')[0] !== 3

export function getVNodeRef(vnode: VNode) {
  return isVue2 ? (vnode as any).data?.ref : vnode.ref
}

export function setVNodeRef(vnode: VNode, ref: any) {
  if (isVue2) {
    ;((vnode as any).data || ((vnode as any).data = {})).ref = ref
  } else {
    vnode.ref = ref
  }
}

export function getVNode(instance: ComponentInternalInstance) {
  return isVue2 ? (instance.proxy as any).$vnode : instance.vnode
}

export function proxy(proxy: any, target: any) {
  if (isVue2) {
    proxy = Object.create(proxy)

    const keys = Object.keys(target)
    for (let i = 0; i < keys.length; i++) {
      Object.defineProperty(proxy, keys[i], {
        enumerable: true,
        configurable: true,
        get() {
          return target[keys[i]]
        },
        set() {}
      })
    }

    return proxy
  } else {
    return new Proxy(proxy, {
      get(_target, key: string) {
        return hasOwn(target, key) ? target[key] : _target[key]
      }
    })
  }
}

// Copied from Vue
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (val: object, key: string | number | symbol): key is keyof typeof val =>
  hasOwnProperty.call(val, key)

export const isArray = Array.isArray
export const isFunction = (val: unknown): val is Function => typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'
