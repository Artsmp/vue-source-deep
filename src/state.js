import { observe } from "./observer/index"
import { proxy } from "./util/index"

export function initState(vm) {
  // vue 的数据来源：props、data、computed、method、watch
  const opt = vm.$options
  if (opt.props) {
    initProps(vm)
  }
  if (opt.methods) {
    initMethods(vm)
  }
  if (opt.data) {
    initData(vm)
  }
  if (opt.computed) {
    initComputed(vm)
  }
  if (opt.watch) {
    initWatch(vm)
  }
}

function initProps(vm) {}
function initMethods(vm) {}

function initData(vm) {
  // 数据初始化工作
  let data = vm.$options.data
  // 数据也要挂载一份到实例上
  data = vm._data = typeof data === 'function' ? data.call(this) : data
  // 对象劫持，用户改变了数据我希望能够得到通知 => 刷新页面：数据变化视图变化 MVVM Object.defineProperty

  // 为了让用户更好的使用，我希望可以直接 vm.xxx 取值

  for(let key in data) {
    proxy(vm, '_data', key)
  }

  observe(data) // 响应式原理
}
function initComputed(vm) {}
function initWatch(vm) {}
