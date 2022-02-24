import { compileToFunction } from './compiler/index'
import { initState } from './state'
import { mountComponent } from './lifecycle'

export function initMixin(Vue) {
  // 初始化流程
  Vue.prototype._init = function (options) {
    // 1. 数据的劫持
    const vm = this
    vm.$options = options // this.$options 指代的就是用户传递的属性

    // 初始化状态(vue的数据来源)
    initState(vm)

    // 如果用户传入了 el 属性，我们就需要进行模板编译
    // 传入 el，就需要实现挂载流程
    if(vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }

  Vue.prototype.$mount = function(el) {
    const vm = this
    const options = vm.$options
    el = document.querySelector(el)
    // 默认会先查找 render，没有就 template，再就是 el
    if(!options.render) {
      // 对模板进行编译
      let template = options.template
      if(!template && el) {
        template = el.outerHTML // 火狐有兼容性问题
      }
      // 我们需要将template转化成render方法（虚拟DOM）
      const render = compileToFunction(template)
      options.render = render
    }

    // 渲染当前的组件（挂载组件）
    mountComponent(vm, el)
  }
}
