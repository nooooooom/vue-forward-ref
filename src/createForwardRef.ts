import { getCurrentInstance, Ref, shallowRef, watch } from 'vue'
import { ComponentInternalInstance } from './types'

export function createForwardRef<T extends Record<string, any>>(
  forwardRef?: Ref<T | null> | null,
  overrideExposed?: Record<string, any> | null,
  instance = getCurrentInstance()
) {
  if (!instance) {
    throw new Error(`createForwardRef is used without current active component instance.`)
  }

  forwardRef = forwardRef || (shallowRef({}) as Ref<T>)

  watch(forwardRef, (refValue) => {
    if (refValue) {
      setRef(
        {
          ...refValue,
          ...overrideExposed
        },
        instance
      )
    } else {
      setRef(refValue, instance)
    }
  })

  return forwardRef
}

function setRef(value: Record<string, any> | null, parent: ComponentInternalInstance) {
  // TODO
}
