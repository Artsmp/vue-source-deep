/**
 * 判断 data 是不是一个对象
 * @param {*} data
 * @returns
 */
export function isObj(data) {
  return typeof data === 'object' && data !== null
}
