import Watcher from "./observer/watcher"
import { patch } from "./vdom/patch";

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function(vnode) {
    const vm = this
    // 我要通过虚拟dom，渲染出真实dom
    vm.$el = patch(vm.$el, vnode) // 需要用虚拟节点创建出真实节点替换掉真实的$el
  }
}

export function mountComponent(vm, el) {
  const options = vm.$options
  vm.$el = el // 真实的 dom 元素

  // 渲染页面
  let updateComponent = () => {
    // 无论是渲染还是更新都会调用此方法
    vm._update(vm._render()) // _render返回的是虚拟DOM,_update渲染成真实DOM
  }
  // 渲染Watcher 每个组件都有一个watcher
  new Watcher(vm, updateComponent, () => {}, true)
}