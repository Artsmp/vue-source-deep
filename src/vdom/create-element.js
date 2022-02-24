export function createElement(tag, data = {}, ...children) {
  let key = data.key
  if(key) {
    delete data.key
  }
  return vnode(tag, data, key, children, undefined)
}

export function createTextNode(text) {
  return vnode(undefined, undefined, undefined, undefined, text)
}

function vnode(tag, data, key, children, text) {
  return { tag, data, key, children, text }
}

// 虚拟节点就是通过 _c、_v 实现用对象来描述dom的操作（是一个js对象）

/* 
将 template 转成 ast 语法树 -> 生成 render 方法 -> 生成虚拟dom -> 真实dom
更新流程：重新生成虚拟dom -> 真实dom
{
  tag: "div",
  key: undefined,
  data: {},
  children: [],
  text: undefined
} 
*/
