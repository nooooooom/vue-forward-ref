import { Ref, shallowRef, watch } from 'vue'
import { compatGetCurrentInstance, isVue2, proxy, setRef, waitParentRefSetting } from './utils'

export function createForwardRef<T extends Record<string, any>>(
  forwardRef?: Ref<T | null> | null,
  overrideExposed?: Record<string, any> | null,
  parent = compatGetCurrentInstance()
) {
  if (!parent) {
    throw new Error(`createForwardRef is used without current active component instance.`)
  }

  forwardRef = forwardRef || (shallowRef(null) as Ref<T | null>)

  let oldRawRef: any = null

  watch(
    forwardRef,
    (refValue) => {
      const parentRef = isVue2 ? parent.$vnode?.data?.ref : parent.vnode.ref
      waitParentRefSetting().then(() => {
        if (parentRef != null) {
          setRef(
            parentRef,
            oldRawRef,
            overrideExposed ? refValue && proxy(refValue, overrideExposed) : refValue,
            parent,
            isVue2 ? parent._isDestroyed : parent.isUnmounted
          )

          oldRawRef = parentRef
        }
      })
    },
    {
      flush: 'pre' // settings for synchronous forward ref
    }
  )

  return forwardRef
}
