import { EMPTY_OBJ, hasOwn, isArray, isFunction, isString, remove } from '@vue/shared'
import { getCurrentInstance, isRef, nextTick, version } from 'vue'

export const isVue2 = +version.split('.')[0] !== 3

export function compatGetCurrentInstance(): any {
  return isVue2 ? getCurrentInstance()?.proxy : getCurrentInstance()
}

export function waitParentRefSetting() {
  return new Promise<void>((resolve) => new Promise<void>((r) => r()).then(() => nextTick(resolve)))
}

export function setRef(
  rawRef: any,
  oldRawRef: any,
  refValue: any,
  parent: any,
  isUnmount?: boolean
) {
  // Here we don't need to deal with unmounted components and runtime errors,
  // because the parent component's `setRef` will deal with it
  if (isUnmount) {
    return
  }

  if (isVue2) {
    if (rawRef !== oldRawRef) {
      vue2_setRef(oldRawRef, refValue, parent, true)
      vue2_setRef(rawRef, refValue, parent)
    }
    return
  }

  if (isArray(rawRef)) {
    rawRef.forEach((r, i) =>
      setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), refValue, parent)
    )
    return
  }

  const value = isUnmount ? null : refValue

  const { i: owner, r: ref } = rawRef
  const oldRef = oldRawRef && (oldRawRef as any).r
  const refs = owner.refs === EMPTY_OBJ ? (owner.refs = {}) : owner.refs
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
          if (isUnmount) {
            isArray(existing) && remove(existing, refValue)
          } else {
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
          }
        } else if (_isString) {
          refs[ref] = value
          if (hasOwn(setupState, ref)) {
            setupState[ref] = value
          }
        } else if (_isRef) {
          ref.value = value
          if (rawRef.k) refs[rawRef.k] = value
        }
      }
      doSet()
    }
  }
}

export function vue2_setRef(ref: any, refValue: any, parent: any, isRemoval?: boolean) {
  if (ref == null) return

  const value = isRemoval ? null : refValue
  const $refsValue = isRemoval ? undefined : refValue

  if (isFunction(ref)) {
    ref(refValue)
    return
  }

  const isFor = parent.$vnode.data.refInFor
  const _isString = typeof ref === 'string' || typeof ref === 'number'
  const _isRef = isRef(ref)
  const refs = parent.$refs

  if (_isString || _isRef) {
    if (isFor) {
      const existing = _isString ? refs[ref] : ref.value
      if (isRemoval) {
        isArray(existing) && remove(existing, refValue)
      } else {
        if (!isArray(existing)) {
          if (_isString) {
            refs[ref] = [refValue]
            setSetupRef(parent, ref, refs[ref])
          } else {
            ref.value = [refValue]
          }
        } else if (!existing.includes(refValue)) {
          existing.push(refValue)
        }
      }
    } else if (_isString) {
      if (isRemoval && refs[ref] !== refValue) {
        return
      }
      refs[ref] = $refsValue
      setSetupRef(parent, ref, value)
    } else if (_isRef) {
      if (isRemoval && ref.value !== refValue) {
        return
      }
      ref.value = value
    }
  }

  function setSetupRef({ _setupState }: any, key: string | number, val: any) {
    if (_setupState && hasOwn(_setupState, key as string)) {
      if (isRef(_setupState[key])) {
        _setupState[key].value = val
      } else {
        _setupState[key] = val
      }
    }
  }
}

export function proxy(proxy: any, target: any) {
  if (isVue2) {
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
