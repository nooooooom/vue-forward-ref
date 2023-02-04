# vue-forward-ref

<a href="https://npmjs.com/package/vue-forward-ref"><img src="https://badgen.net/npm/v/vue-forward-ref?color=blue" alt="npm package"></a>

💫 Make it easier for HOCs to forward refs.

## Installation

```bash
pnpm install vue-forward-ref
```

## Usage

`vue-forward-ref` provides two forwarding methods.

The easiest is to use `forwardRef` to wrap the component you need to forward.

```js
import { forwardRef } from 'vue-forward-ref'

defineComponent({
  name: 'Wrapper',
  setup() {
    return () => {
      // The component can be any type used to create a vnode
      // - string
      // - Component
      // - ConcreteComponent
      return forwardRef('div')
    }
  }
})
```

If you need to extend or override the forward, you can use `createForwardRef`.

```js
import { createForwardRef } from 'vue-forward-ref'

defineComponent({
  name: 'Wrapper',
  setup() {
    const override = {
      // ...
    }
    // Assign `forwardRef` to the component that needs to be forwarded,
    // and the first parameter allows you to pass in the ref already defined
    const forwardRef = createForwardRef(null, override)

    return () => {
      return h(Component, {
        ref: forwardRef
      })
    }
  }
})
```

Either way, they allow you to customize which component the declaration is forwarded on.

```js
forwardRef(Component, instance)
// or
createForwardRef(null, null, instance)
```

## License

[MIT](./LICENSE)
