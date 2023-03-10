import { getCurrentInstance, Ref, shallowRef, watch } from 'vue'
import { isVue2, proxy, setRef, waitParentRefSetting } from './utils'

export function createForwardRef<T extends Record<string, any>>(
  forwardRef?: Ref<T | null> | null,
  overrideExposed?: Record<string, any> | null,
  parent = getCurrentInstance()
) {
  if (!parent) {
    throw new Error(`createForwardRef is used without current active component instance.`)
  }

  forwardRef = forwardRef || (shallowRef(null) as Ref<T | null>)

  let oldRawRef: any = null

  watch(
    forwardRef,
    (refValue) => {
      const parentRef = isVue2 ? (parent.proxy as any).$vnode?.data?.ref : parent.vnode.ref
      waitParentRefSetting().then(() => {
        setRef(
          parentRef,
          oldRawRef,
          overrideExposed ? refValue && proxy(refValue, overrideExposed) : refValue,
          parent,
          isVue2 ? (parent as any)._isDestroyed : parent.isUnmounted
        )

        oldRawRef = parentRef
      })
    },
    {
      flush: 'pre' // settings for synchronous forward ref
    }
  )

  return forwardRef
}
