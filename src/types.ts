import { Component, DefineComponent, getCurrentInstance, VNode } from 'vue'

export type ComponentType =
  | string
  | Component
  | DefineComponent
  | Symbol // Text | Comment | Teleport | Suspense
  | { __isSuspense: true } // Suspense
  | Function // FunctionalComponent
  | VNode

// for compatible with Vue2 in type naming
export type ComponentInternalInstance = NonNullable<ReturnType<typeof getCurrentInstance>>
