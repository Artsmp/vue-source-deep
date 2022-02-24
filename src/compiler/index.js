import { parseHTML } from './parse-html'

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // 匹配花括号的正则

/* 
<div id="app" class="text">
  <span style="color: red">hello{{name}}</span>
</div>
_c("div", {id:"app", class: "text"}, _c("span", {style:{color:"red"}}, _v("hello"+_s(name))))
*/
export function compileToFunction(template) {
  // 1. 解析HTML字符串 -> AST语法树
  let root = parseHTML(template)
  // 2. AST语法树 -> render 函数
  let code = generate(root)
  let render = `with(this){return ${code}}`
  let renderFn = new Function(render)
  return renderFn
}

// 生成html标签属性的字符串
function genProps(attrs) {
  let str = ''
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i]
    if (attr.name === 'style') {
      let styleObj = {}
      attr.value.split(';').forEach((item) => {
        let [styleKey, styleVal] = item.split(':')
        styleObj[styleKey.trim()] = styleVal.trim()
      })
      attr.value = styleObj
    }
    str += `${attr.name}:${JSON.stringify(attr.value)},`
  }
  return `{${str}}`
}

function genChildren(children) {
  if (children && children.length > 0) {
    return `${children.map((child) => gen(child)).join(',')}`
  } else {
    return 'undefined'
  }
}

function gen(node) {
  if (node.type == 1) {
    return generate(node)
  } else {
    let text = node.text
    if (!defaultTagRE.test(text)) return `_v(${JSON.stringify(text)})`
    let tokens = [] // 拆解后的字符串数组
    let lastIndex = (defaultTagRE.lastIndex = 0) // 重置一下正则匹配过后的下标，lastIndex用来保存上次匹配到哪里的下标
    let match, index // match: 存放匹配的结果，index：当前匹配结果的下标
    while ((match = defaultTagRE.exec(text))) {
      index = match.index
      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)))
      }
      tokens.push(`_s(${match[1]})`) // match[1] 是花括号中的结果 match[0] 是包含花括号的结果
      lastIndex = index + match[0].length
    }
    // 截取字符串最后部分
    if (lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)))
    }
    return `_v(${tokens.join('+')})`
  }
}

// 将AST转成 render函数能解析的字符串
function generate(el) {
  let code = `_c(${el.tag}, ${genProps(el.attrs)}, ${genChildren(el.children)})`
  return code
}
