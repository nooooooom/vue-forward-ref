import { getCurrentInstance, isRef, Ref, shallowRef, watch } from 'vue'
import {
  getVNode,
  getVNodeRef,
  hasOwn,
  isArray,
  isFunction,
  isString,
  isVue2,
  proxy
} from './utils'

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
  if (!rawRef) return
  if (isArray(rawRef)) {
    rawRef.forEach((r, i) =>
      setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), refValue, vnode)
    )
    return
  }

  if (isVue2) {
    const ref = rawRef
    if (isFunction(ref)) {
      ref(refValue)
      return
    }

    const vm = vnode.context
    const isFor = vnode.data.refInFor
    const _isString = isString(ref) || typeof ref === 'number'
    const _isRef = isRef(ref)
    const refs = vm.$refs

    const setSetupRef = () => {
      const { _setupState } = vm
      if (_setupState && hasOwn(_setupState, ref)) {
        if (isRef(_setupState[ref])) {
          _setupState[ref].value = refs[ref]
        } else {
          _setupState[ref] = refs[ref]
        }
      }
    }

    if (_isString || _isRef) {
      if (isFor) {
        const existing = _isString ? refs[ref] : ref.value
        if (!isArray(existing)) {
          if (_isString) {
            refs[ref] = [refValue]
            setSetupRef()
          } else {
            ref.value = [refValue]
          }
        } else if (!existing.includes(refValue)) {
          existing.push(refValue)
        }
      } else if (_isString) {
        refs[ref] = refValue
        setSetupRef()
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
      const _isString = isString(ref)
      const _isRef = isRef(ref)
      if (_isString || _isRef) {
        const doSet = () => {
          if (rawRef.f) {
            const existing = _isString
              ? hasOwn(setupState, ref)
                ? setupState[ref]
                : refs[ref]
              : ref.value
            if (!isArray(existing)) {
              if (_isString) {
                refs[ref] = [refValue]
                if (hasOwn(setupState, ref)) {
                  setupState[ref] = refs[ref]
                }
              } else {
                ref.value = [refValue]
                if (rawRef.k) refs[rawRef.k] = ref.value
              }
            } else if (!existing.includes(refValue)) {
              existing.push(refValue)
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
