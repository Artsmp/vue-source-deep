// AST 语法树是用对象来描述原生语法的
// 虚拟 DOM 用对象来描述 dom 结构的

/* 
AST 语法树：
let root = {
  tagName: 'div',
  attrs: [
    {
      name: 'id',
      value: 'app',
    },
  ],
  parent: null,
  type: 1, // 是个元素节点
  children: [
    {
      tagName: 'span',
      attrs: [
        {
          name: 'class',
          value: 'text',
        },
      ],
      parent: root,
      type: 1,
      children: [
        {
          text: 'hello',
          type: 3, // 文本节点
        },
      ],
    },
  ]
}

*/

// ?: 表示匹配不捕获 不要某个分组
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*` // 匹配标签名 el-layout 这样的
const qnameCapture = `((?:${ncname}\\:)?${ncname})` // 命名空间标签：<aaa:bbb>
const startTagOpen = new RegExp(`^<${qnameCapture}`) // 标签开头的正则 捕获的内容是标签名
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`) // 匹配标签结尾的 </div>
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/ // 匹配属性的
const startTagClose = /^\s*(\/?)>/ // 匹配标签结束的 >
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g

/* // arguments[0] 匹配到的标签 arguments[1] 匹配到的标签名字（也就是第一个分组）
let r = '<dd:cc>'.match(startTagOpen)
console.log('==>r', r)

let r2 = '</dd:cc>'.match(endTag)
console.log('==>r2', r2)

let r3 = '   class    =    "123"'.match(attribute)
console.log('==>r3', r3) */

/* 
<div id="app" class="text">
  <span style="color: red">{{name}}</span>
  <span>{{age}}</span>
</div>
*/

let root = null // AST抽象语法树(树根)对象
let currentParent // 用来标识当前父亲是谁
let stack = [] // 通过栈结构去标记标签是否成对出现
const ELEMENT_TYPE = 1 // 元素节点
const TEXT_TYPE = 3 // 文本节点

function createASTElement(tagName, attrs) {
  return {
    tag: tagName,
    type: ELEMENT_TYPE,
    children: [],
    attrs,
    parent: null,
  }
}

function start(tagName, attrs) {
  // 遇到开始标签就创建一个 AST 元素
  let element = createASTElement(tagName, attrs)
  if (!root) {
    root = element
  }
  currentParent = element // 把当前元素标记成父AST树
  stack.push(element) // 将开始标签存放到栈中
}
function chars(text) {
  text = text.replace(/\s/g, '')
  if (text) {
    currentParent.children.push({
      text,
      type: TEXT_TYPE,
    })
  }
}
function end(tagName) {
  let element = stack.pop()
  // 那他如果相等那前一个就是他父亲
  if (element.tag !== tagName) {
    console.error('标签不匹配，请检查模板的语法！')
    return
  }
  currentParent = stack[stack.length - 1] // 他前一个就是他父亲
  if (currentParent) {
    element.parent = currentParent
    currentParent.children.push(element)
  }
}

export function parseHTML(html) {
  function advance(n) {
    html = html.substring(n)
  }
  function parseStartTag() {
    let start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
      }
      advance(start[0].length) // 去掉被匹配部分 start[0] == '<div'
      let end, attr // 是否能匹配到标签结束：能直接匹配到说明没有属性【!(end = html.match(startTagClose))】，不能则继续匹配属性【(attr = html.match(attribute))】
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        advance(attr[0].length) // 将匹配到的属性也从 html 字符串中去掉
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5],
        })
      }
      if (end) {
        advance(end[0].length) // 干掉最后一个 > 符号
        return match
      }
    }
  }
  // 循环去获取，然后获取到后删除掉已经被匹配过的那一段字符串（正则匹配）
  while (html) {
    let textEnd = html.indexOf('<')
    if (textEnd == 0) {
      // 如果当前索引为0，肯定是一个标签：开始标签|结束标签
      let startTagMatch = parseStartTag() // 通过这个方法获取到匹配的结果：tagName、attrs
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue // 如果开始标签匹配完毕后，继续下一次
      }
      let endTagMatch = html.match(endTag)
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        end(endTagMatch[1])
        continue
      }
    }
    let text = ''
    if (textEnd >= 0) {
      text = html.substring(0, textEnd)
    }
    if (text) {
      advance(text.length)
      chars(text)
    }
  }
  return root
}