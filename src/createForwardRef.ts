import { getCurrentInstance, isRef, Ref, shallowRef, watch } from 'vue'
import { getVNode, getVNodeRef, hasOwn, isFunction, isString, isVue2, proxy } from './utils'

export function createForwardRef<T extends Record<string, any>>(
  forwardRef?: Ref<T | null> | null,
  overrideExposed?: Record<string, any> | null,
  instance = getCurrentInstance()
) {
  if (!instance) {
    throw new Error(`createForwardRef is used without current active component instance.`)
  }

  forwardRef = forwardRef || (shallowRef(null) as Ref<T | null>)

  let oldRawRef: any = null

  watch(
    forwardRef,
    (refValue) => {
      const vnode = getVNode(instance)
      const rawRef = getVNodeRef(vnode)

      setRef(
        rawRef,
        oldRawRef,
        overrideExposed ? refValue && proxy(refValue, overrideExposed) : refValue,
        vnode
      )

      oldRawRef = rawRef
    },
    {
      flush: 'pre' // settings for synchronous forward ref
    }
  )

  return forwardRef
}

// Here we don't need to deal with unmounted components and type errors,
// because the wrapper component's `setRef` will handle it.
export function setRef(rawRef: any, oldRawRef: any, refValue: any, vnode: any) {
  if (isVue2) {
    const ref = rawRef
    if (!ref) return
    if (isFunction(ref)) {
      ref(refValue)
      return
    }

    const vm = vnode.context
    const _isString = isString(ref) || typeof ref === 'number'
    const _isRef = isRef(ref)
    const refs = vm.$refs

    if (_isString || _isRef) {
      if (_isString) {
        refs[ref] = refValue

        const _setupState = vm
        if (_setupState && hasOwn(_setupState, ref)) {
          if (isRef(_setupState[ref])) {
            _setupState[ref].value = refs[ref]
          } else {
            _setupState[ref] = refs[ref]
          }
        }
      } else if (_isRef) {
        ref.value = refValue
      }
    }
  } else {
    const { i: owner, r: ref } = rawRef
    if (!owner) return
    const oldRef = oldRawRef && (oldRawRef as any).r
    const refs = owner.refs
    const setupState = owner.setupState

    // dynamic ref changed. unset old ref
    if (oldRef != null && oldRef !== ref) {
      if (isString(oldRef)) {
        refs[oldRef] = null
        if (hasOwn(setupState, oldRef)) {
          setupState[oldRef] = null
        }
      } else if (isRef(oldRef)) {
        oldRef.value = null
      }
    }

    if (isFunction(ref)) {
      ref(refValue, refs)
    } else {
      const _isString = typeof ref === 'string'
      const _isRef = isRef(ref)

      if (_isString || _isRef) {
        const doSet = () => {
          if (rawRef.f) {
            if (_isString) {
              refs[ref] = [refValue]
              if (hasOwn(setupState, ref)) {
                setupState[ref] = refs[ref]
              }
            } else {
              ref.value = [refValue]
              if (rawRef.k) refs[rawRef.k] = ref.value
            }
          } else if (_isString) {
            refs[ref] = refValue
            if (hasOwn(setupState, ref)) {
              setupState[ref] = refValue
            }
          } else if (_isRef) {
            ref.value = refValue
            if (rawRef.k) refs[rawRef.k] = refValue
          }
        }
        // settings for synchronous forward ref
        doSet()
      }
    }
  }
}
