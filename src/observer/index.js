import { isObj } from '../util/index'

class Observer {
  constructor(value) {
    // 需要递归遍历深层次对象
    this.walk(value)
  }

  walk(data) {
    let keys = Object.keys(data) // [name, age, address]
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let value = data[key]
      defineReactive(data, key, value)
    }
  }
}

// 把 data 数据都使用 Object.defineProperty 重新定义（不能兼容 IE8 及以下）
export function observe(data) {
  if (!isObj(data)) {
    return
  }
  return new Observer(data)
}

function defineReactive(data, key, value) {
  observe(value) // 递归实现深度劫持
  Object.defineProperty(data, key, {
    get() {
      // 获取值得时候做操作
      return value
    },
    set(newVal) {
      // 设置值的时候做操作
      if (value === newVal) return
      console.log('==>值发生变化了')
      observe(newVal) // 避免用户是赋值为一个新对象而没有深度劫持
      value = newVal
    },
  })
}
