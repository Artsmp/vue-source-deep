import { initState } from './state'

export function initMixin(Vue) {
  // 初始化流程
  Vue.prototype._init = function (options) {
    // 1. 数据的劫持
    const vm = this
    vm.$options = options // this.$options 指代的就是用户传递的属性

    // 初始化状态(vue的数据来源)
    initState(vm)
  }
}
