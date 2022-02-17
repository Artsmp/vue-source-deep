// 要重写数组的方法7个

const oldArrayMethods = Array.prototype
// 创建一个对象，该对象的原型链是 oldArrayMethods：重写的在第一层，原本的在第二层
export let arrayMethods = Object.create(oldArrayMethods)

const methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'splice', 'sort']

methods.forEach((method) => {
  arrayMethods[method] = function (...args) {
    console.log('==>用户调用了 push 方法') // AOP切片编程
    oldArrayMethods[method].apply(this, args) // 调用原生的数组方法
    let inserted,
      ob = this.__ob__
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice': // 3个及以上的参数 增删改的功能 增加的时候 第三个参数及以后的参数是增加的内容 需要对它们进行劫持
        inserted = args.slice(2)
        break
      default:
        break
    }
    if (inserted) {
      ob.observerArray(inserted)
    }
  }
})
