class Watcher {
  constructor(vm, exprOrFn, callback, options) {
    this.vm = vm
    this.callback = callback
    this.options = options

    this.getter = exprOrFn // 将内部传过来的回调函数放到 getter 属性上

    this.get()
  }
  get() {
    this.getter()
  }
}

export default Watcher