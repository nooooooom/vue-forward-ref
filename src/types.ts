import { getCurrentInstance } from 'vue'

// for compatible with Vue2 in type naming
export type ComponentInternalInstance = NonNullable<ReturnType<typeof getCurrentInstance>>
