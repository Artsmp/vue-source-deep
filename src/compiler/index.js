import { parseHTML } from "./parse-html"


export function compileToFunction(template) {
  // 1. 解析HTML字符串 -> AST语法树
  let root = parseHTML(template)
  console.log('==>root', root)
  return function render() {}
}
