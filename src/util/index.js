/**
 * 判断 data 是不是一个对象
 * @param {*} data
 * @returns
 */
export function isObj(data) {
  return typeof data === 'object' && data !== null
}
/**
 * 定义不可枚举属性
 * @param {*} data
 * @param {*} key
 * @param {*} value
 */
export function def(data, key, value) {
  Object.defineProperty(data, key, {
    enumerable: false,
    configurable: false,
    value,
  })
}
