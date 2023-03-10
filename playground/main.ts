import Vue, { ref, h, defineComponent } from 'vue'
import { createHoc } from '../test/helpers'

const Div = defineComponent({
  render() {
    return h('div')
  }
})

new Vue({
  setup() {
    const instance = ref()
    const rawRef = ref()

    window.instance = instance
    window.rawRef = rawRef

    return () =>
      // h(
      //   createHoc(
      //     'div',
      //     {
      //       id: 'id'
      //     },
      //     false
      //   ),
      //   {
      //     ref: instance
      //   }
      // )
      // ----------------------------------------------------------------------
      h(
        createHoc(
          Div,
          {
            id: 'id'
          },
          true
        ),
        {
          ref: instance
        }
      )
  }
}).$mount('#app')
