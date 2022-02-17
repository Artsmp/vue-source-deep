import { def, isObj } from '../util/index'
import { arrayMethods } from './array.js'

class Observer {
  constructor(value) {
    // 需要递归遍历深层次对象

    // 如果是数组不需要对索引进行观测，会导致性能问题。前端开发中很少操作索引，而是使用数组提供的api
    // shift unshift pop push splice reverse sort
    // 我给每一个监控过得对象都增加这个属性
    // value.__ob__ = this; // 这个会造成死递归 把自己又挂载到自己身上
    def(value, '__obj__', this) // 让其不可配置和枚举，在调用 walk 方法时获取对象上的key就不会获取到 __ob__
    if (Array.isArray(value)) {
      // 1. 对数组的原型方法去进行劫持（主要是针对会改变原数组的方法）
      value.__proto__ = arrayMethods
      // 2. 劫持数组中的每一项（对象）
      this.observerArray(value)
      return
    }

    this.walk(value)
  }

  observerArray(value) {
    for (let i = 0; i < value.length; i++) {
      observe(value[i])
    }
  }

  walk(data) {
    let keys = Object.keys(data) // [name, age, address] 因为 __obj__ 被设置为不可枚举，所以这里就不会出现
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
  console.log('==>data, key, value', data, key, value)
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
