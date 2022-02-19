# 配置 rollup 开发环境

1. 安装：`npm i -D @babel/core @babel/preset-env rollup-plugin-babel rollup-plugin-serve cross-env rollup`

```
@babel/core and @babel/preset-env：用来转义 es 语法
rollup-plugin-babel：桥梁，起到连接 babel 和 rollup 的作用
rollup-plugin-serve：启动一个静态服务器
cross-env：设置环境变量
rollup：打包器
```

2. 编写 rollup 配置文件

```js
import babel from 'rollup-plugin-babel'
import serve from 'rollup-plugin-serve'

export default {
  input: 'src/index.js', // 入口文件
  output: {
    file: './dist/umd/vue.js', // 打包后的文件
    name: 'Vue', // 指定打包后全局变量的名字
    format: 'umd', // 使用 umd 的模块规范
    sourcemap: true, // 开启源码调试，可以找到被 babel 转义后的代码在源码中的报错位置
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
    process.env.ENV === 'development' &&
      serve({
        open: true,
        openPage: '/public/index.html',
        port: 3000,
        contentBase: '',
      }),
  ],
}
```

3. 创建文件

- public/index.html：静态资源服务器的首页

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>deep learn vue</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="/dist/umd/vue.js"></script>
    <script>
      let vm = new Vue({
        el: '#app',
        data() {
          return {
            name: 'artsmp',
            age: 18,
          }
        },
      })
    </script>
  </body>
</html>
```

- src/index.js：文件入口

```js
function Vue(options) {
  console.log('==>options', options)
}

export default Vue
```

# 对数据进行监控

## 在实现响应式原理之前需要对代码进行合理的划分

1. 我们在 Vue 构造函数的原型上添加一个 `\_init` 方法，调用此方法并传入 `options`。但是我们不希望这边出现很多混乱的原型方法，所以我们单独抽离一个 `init.js` 文件 在这个文件中进行 Vue 实例的一系列初始化操作，例如 `initMixin`、initRender 等。init.js 文件中导出一系列初始化相关的操作。相关的文件：`init.js index.js`
2. 我们在 `init.js -> initMixin` 方法中，我们需要对一系列的选项进行初始化：例如：props、methods、data、computed、watch。所以我们新建一个 `state.js` 并导出一个 `initState` 函数，在这边对一系列选项里的内容初始化。然后我们再根据不同的 状态创建不同的初始化方法，例如针对 `data` 我们创建 `initData` 函数，它接收一个 **vue 实例**作为参数。相关的文件：`init.js state.js`
3. 在 `initData.js` 中我们开始做响应式原理（数据劫持）。新建一个 `observer/index.js` 导出一个 `observe` 方法，这个方法接受 data 数据作为参数，在这个文件中使用 `Object.defineProperty` 进行数据劫持。

## 实现的逻辑
对象部分：通过递归的方式去进行对象的深度劫持 observe 和 defineReactive 方法
数组部分：有一个细节就是，我们会在每个已经被劫持过的对象上挂载一个 `__obj__` 的属性，这个属性被定义为不可枚举和配置。
主要是用来在 1.1 步骤中。
1. 首先就是对于数组原型上的七个改变数组本身的方法进行重写：push pop shift unshift splice sort reverse
   1.1 这边像 push、unshift、splice 这两个新增值得方法，我们需要对新增的数组元素再次进行劫持
2. 然后遍历这个数组，对数组的每一项**值**进行劫持


# 模板编译

## 1. 将模板HTML字符串编译为 AST 抽象语法树
主要的内容就是构造一个JavaScript对象，用来描述这段html字符串的语法内容。
思想就是通过while循环不断地对字符串执行正则匹配，比如开始标签的匹配、标签属性的匹配、文本节点的匹配以及结束标签的匹配。设计到的思想有：通过**循环的方式避过递归**，通过正则去匹配想要的内容，正则的**匹配但不捕获（?:）**思想，通过**栈**的数据结构来实现开始和结束标签的匹配

AST 语法树的结构：
```js
const root = {
  tag: 'div',
  attrs: [
    {
      name: 'id',
      value: 'root',
    },
  ],
  type: 1, // 表示是元素节点
  parent: null,
  chidlren: [
    {
      tag: 'span',
      attrs: [],
      children: [
        {
          type: 3, // 文本节点
          text: '{{name}}', // 文本节点内容
        },
      ],
      type:1,
      parent: refDiv,
    }
  ]
}
```