export function patch(oldVnode, vnode) {
  // 1. 判断是更新还是要渲染
  const isRealElement = oldVnode.nodeType
  if (isRealElement) {
    const oldElm = oldVnode
    const parentEl = oldElm.parentNode

    let el = createElm(vnode)
    parentEl.insertBefore(el, oldElm.nextSibling)
    parentEl.removeChild(oldElm)
  }
  // 递归创建真实节点，替换老节点
}

// 根据虚拟节点创建真实的节点
function createElm(vnode) {
  let {tag, children, key, text} = vnode
  if(typeof tag === 'string') {
    // 标签
    vnode.el = document.createElement(tag)

    updateProps(vnode)

    children.forEach(child => { // 递归创建真实节点，并还给父节点
      console.log(vnode.el);
      return vnode.el.appendChild(createElm(child))
    })
  }else {
    // 不是标签就是文本
    // 虚拟dom上映射着真实dom，方便后续更新操作
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

function updateProps(vnode) {
  let newProps = vnode.data
  let el = vnode.el
  for(let key in newProps) {
    if(key === 'style') {
      for(let styleName in newProps.style) {
        el.style[styleName] = newProps.style[styleName]
      }
    } else if(key === 'class') {
      el.className = newProps.class
    } else {
      el.setAttribute(key, newProps[key])
    }
  }
}
