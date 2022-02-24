(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

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
  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名 el-layout 这样的

  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // 命名空间标签：<aaa:bbb>

  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名

  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>

  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的

  const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >
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

  let root = null; // AST抽象语法树(树根)对象

  let currentParent; // 用来标识当前父亲是谁

  let stack = []; // 通过栈结构去标记标签是否成对出现

  const ELEMENT_TYPE = 1; // 元素节点

  const TEXT_TYPE = 3; // 文本节点

  function createASTElement(tagName, attrs) {
    return {
      tag: tagName,
      type: ELEMENT_TYPE,
      children: [],
      attrs,
      parent: null
    };
  }

  function start(tagName, attrs) {
    // 遇到开始标签就创建一个 AST 元素
    let element = createASTElement(tagName, attrs);

    if (!root) {
      root = element;
    }

    currentParent = element; // 把当前元素标记成父AST树

    stack.push(element); // 将开始标签存放到栈中
  }

  function chars(text) {
    text = text.replace(/\s/g, '');

    if (text) {
      currentParent.children.push({
        text,
        type: TEXT_TYPE
      });
    }
  }

  function end(tagName) {
    let element = stack.pop(); // 那他如果相等那前一个就是他父亲

    if (element.tag !== tagName) {
      console.error('标签不匹配，请检查模板的语法！');
      return;
    }

    currentParent = stack[stack.length - 1]; // 他前一个就是他父亲

    if (currentParent) {
      element.parent = currentParent;
      currentParent.children.push(element);
    }
  }

  function parseHTML(html) {
    function advance(n) {
      html = html.substring(n);
    }

    function parseStartTag() {
      let start = html.match(startTagOpen);

      if (start) {
        const match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length); // 去掉被匹配部分 start[0] == '<div'

        let end, attr; // 是否能匹配到标签结束：能直接匹配到说明没有属性【!(end = html.match(startTagClose))】，不能则继续匹配属性【(attr = html.match(attribute))】

        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          advance(attr[0].length); // 将匹配到的属性也从 html 字符串中去掉

          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5]
          });
        }

        if (end) {
          advance(end[0].length); // 干掉最后一个 > 符号

          return match;
        }
      }
    } // 循环去获取，然后获取到后删除掉已经被匹配过的那一段字符串（正则匹配）


    while (html) {
      let textEnd = html.indexOf('<');

      if (textEnd == 0) {
        // 如果当前索引为0，肯定是一个标签：开始标签|结束标签
        let startTagMatch = parseStartTag(); // 通过这个方法获取到匹配的结果：tagName、attrs

        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue; // 如果开始标签匹配完毕后，继续下一次
        }

        let endTagMatch = html.match(endTag);

        if (endTagMatch) {
          advance(endTagMatch[0].length);
          end(endTagMatch[1]);
          continue;
        }
      }

      let text = '';

      if (textEnd >= 0) {
        text = html.substring(0, textEnd);
      }

      if (text) {
        advance(text.length);
        chars(text);
      }
    }

    return root;
  }

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // 匹配花括号的正则

  /* 
  <div id="app" class="text">
    <span style="color: red">hello{{name}}</span>
  </div>
  _c("div", {id:"app", class: "text"}, _c("span", {style:{color:"red"}}, _v("hello"+_s(name))))
  */

  function compileToFunction(template) {
    // 1. 解析HTML字符串 -> AST语法树
    let root = parseHTML(template); // 2. AST语法树 -> render 函数

    let code = generate(root);
    let render = `with(this){return ${code}}`;
    let renderFn = new Function(render);
    return renderFn;
  } // 生成html标签属性的字符串

  function genProps(attrs) {
    let str = '';

    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i];

      if (attr.name === 'style') {
        let styleObj = {};
        attr.value.split(';').forEach(item => {
          if (item) {
            let [styleKey, styleVal] = item.split(':');
            styleObj[styleKey.trim()] = styleVal.trim();
          }
        });
        attr.value = styleObj;
      }

      str += `${attr.name}:${JSON.stringify(attr.value)},`;
    }

    return `{${str}}`;
  }

  function genChildren(children) {
    if (children && children.length > 0) {
      return `${children.map(child => gen(child)).join(',')}`;
    } else {
      return 'undefined';
    }
  }

  function gen(node) {
    if (node.type == 1) {
      return generate(node);
    } else {
      let text = node.text;
      if (!defaultTagRE.test(text)) return `_v(${JSON.stringify(text)})`;
      let tokens = []; // 拆解后的字符串数组

      let lastIndex = defaultTagRE.lastIndex = 0; // 重置一下正则匹配过后的下标，lastIndex用来保存上次匹配到哪里的下标

      let match, index; // match: 存放匹配的结果，index：当前匹配结果的下标

      while (match = defaultTagRE.exec(text)) {
        index = match.index;

        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }

        tokens.push(`_s(${match[1]})`); // match[1] 是花括号中的结果 match[0] 是包含花括号的结果

        lastIndex = index + match[0].length;
      } // 截取字符串最后部分


      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }

      return `_v(${tokens.join('+')})`;
    }
  } // 将AST转成 render函数能解析的字符串


  function generate(el) {
    let code = `_c("${el.tag}", ${genProps(el.attrs)}, ${genChildren(el.children)})`;
    return code;
  }

  /**
   * 判断 data 是不是一个对象
   * @param {*} data
   * @returns
   */
  function isObj(data) {
    return typeof data === 'object' && data !== null;
  }
  /**
   * 定义不可枚举属性
   * @param {*} data
   * @param {*} key
   * @param {*} value
   */

  function def(data, key, value) {
    Object.defineProperty(data, key, {
      enumerable: false,
      configurable: false,
      value
    });
  } // 取值时实现代理效果

  function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
      get() {
        return vm[source][key];
      },

      set(newVal) {
        vm[source][key] = newVal;
      }

    });
  }

  // 要重写数组的方法7个
  const oldArrayMethods = Array.prototype; // 创建一个对象，该对象的原型链是 oldArrayMethods：重写的在第一层，原本的在第二层

  let arrayMethods = Object.create(oldArrayMethods);
  const methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'splice', 'sort'];
  methods.forEach(method => {
    arrayMethods[method] = function (...args) {
      console.log('==>用户调用了 push 方法'); // AOP切片编程

      oldArrayMethods[method].apply(this, args); // 调用原生的数组方法

      let inserted,
          ob = this.__ob__;

      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;

        case 'splice':
          // 3个及以上的参数 增删改的功能 增加的时候 第三个参数及以后的参数是增加的内容 需要对它们进行劫持
          inserted = args.slice(2);
          break;
      }

      if (inserted) {
        ob.observerArray(inserted);
      }
    };
  });

  class Observer {
    constructor(value) {
      // 需要递归遍历深层次对象
      // 如果是数组不需要对索引进行观测，会导致性能问题。前端开发中很少操作索引，而是使用数组提供的api
      // shift unshift pop push splice reverse sort
      // 我给每一个监控过得对象都增加这个属性
      // value.__ob__ = this; // 这个会造成死递归 把自己又挂载到自己身上
      def(value, '__obj__', this); // 让其不可配置和枚举，在调用 walk 方法时获取对象上的key就不会获取到 __ob__

      if (Array.isArray(value)) {
        // 1. 对数组的原型方法去进行劫持（主要是针对会改变原数组的方法）
        value.__proto__ = arrayMethods; // 2. 劫持数组中的每一项（对象）

        this.observerArray(value);
        return;
      }

      this.walk(value);
    }

    observerArray(value) {
      for (let i = 0; i < value.length; i++) {
        observe(value[i]);
      }
    }

    walk(data) {
      let keys = Object.keys(data); // [name, age, address] 因为 __obj__ 被设置为不可枚举，所以这里就不会出现

      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = data[key];
        defineReactive(data, key, value);
      }
    }

  }

  function defineReactive(data, key, value) {
    observe(value); // 递归实现深度劫持

    Object.defineProperty(data, key, {
      get() {
        // 获取值得时候做操作
        return value;
      },

      set(newVal) {
        // 设置值的时候做操作
        if (value === newVal) return;
        console.log('==>值发生变化了');
        observe(newVal); // 避免用户是赋值为一个新对象而没有深度劫持

        value = newVal;
      }

    });
  } // 把 data 数据都使用 Object.defineProperty 重新定义（不能兼容 IE8 及以下）


  function observe(data) {
    if (!isObj(data)) {
      return;
    }

    return new Observer(data);
  }

  function initState(vm) {
    // vue 的数据来源：props、data、computed、method、watch
    const opt = vm.$options;

    if (opt.props) ;

    if (opt.methods) ;

    if (opt.data) {
      initData(vm);
    }

    if (opt.computed) ;

    if (opt.watch) ;
  }

  function initData(vm) {
    // 数据初始化工作
    let data = vm.$options.data; // 数据也要挂载一份到实例上

    data = vm._data = typeof data === 'function' ? data.call(this) : data; // 对象劫持，用户改变了数据我希望能够得到通知 => 刷新页面：数据变化视图变化 MVVM Object.defineProperty
    // 为了让用户更好的使用，我希望可以直接 vm.xxx 取值

    for (let key in data) {
      proxy(vm, '_data', key);
    }

    observe(data); // 响应式原理
  }

  class Watcher {
    constructor(vm, exprOrFn, callback, options) {
      this.vm = vm;
      this.callback = callback;
      this.options = options;
      this.getter = exprOrFn; // 将内部传过来的回调函数放到 getter 属性上

      this.get();
    }

    get() {
      this.getter();
    }

  }

  function patch(oldVnode, vnode) {
    // 1. 判断是更新还是要渲染
    const isRealElement = oldVnode.nodeType;

    if (isRealElement) {
      const oldElm = oldVnode;
      const parentEl = oldElm.parentNode;
      let el = createElm(vnode);
      parentEl.insertBefore(el, oldElm.nextSibling);
      parentEl.removeChild(oldElm);
    } // 递归创建真实节点，替换老节点

  } // 根据虚拟节点创建真实的节点

  function createElm(vnode) {
    let {
      tag,
      children,
      key,
      text
    } = vnode;

    if (typeof tag === 'string') {
      // 标签
      vnode.el = document.createElement(tag);
      updateProps(vnode);
      children.forEach(child => {
        // 递归创建真实节点，并还给父节点
        console.log(vnode.el);
        return vnode.el.appendChild(createElm(child));
      });
    } else {
      // 不是标签就是文本
      // 虚拟dom上映射着真实dom，方便后续更新操作
      vnode.el = document.createTextNode(text);
    }

    return vnode.el;
  }

  function updateProps(vnode) {
    let newProps = vnode.data;
    let el = vnode.el;

    for (let key in newProps) {
      if (key === 'style') {
        for (let styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else if (key === 'class') {
        el.className = newProps.class;
      } else {
        el.setAttribute(key, newProps[key]);
      }
    }
  }

  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      const vm = this; // 我要通过虚拟dom，渲染出真实dom

      vm.$el = patch(vm.$el, vnode); // 需要用虚拟节点创建出真实节点替换掉真实的$el
    };
  }
  function mountComponent(vm, el) {
    vm.$options;
    vm.$el = el; // 真实的 dom 元素
    // 渲染页面

    let updateComponent = () => {
      // 无论是渲染还是更新都会调用此方法
      vm._update(vm._render()); // _render返回的是虚拟DOM,_update渲染成真实DOM

    }; // 渲染Watcher 每个组件都有一个watcher


    new Watcher(vm, updateComponent, () => {}, true);
  }

  function initMixin(Vue) {
    // 初始化流程
    Vue.prototype._init = function (options) {
      // 1. 数据的劫持
      const vm = this;
      vm.$options = options; // this.$options 指代的就是用户传递的属性
      // 初始化状态(vue的数据来源)

      initState(vm); // 如果用户传入了 el 属性，我们就需要进行模板编译
      // 传入 el，就需要实现挂载流程

      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      const vm = this;
      const options = vm.$options;
      el = document.querySelector(el); // 默认会先查找 render，没有就 template，再就是 el

      if (!options.render) {
        // 对模板进行编译
        let template = options.template;

        if (!template && el) {
          template = el.outerHTML; // 火狐有兼容性问题
        } // 我们需要将template转化成render方法（虚拟DOM）


        const render = compileToFunction(template);
        options.render = render;
      } // 渲染当前的组件（挂载组件）


      mountComponent(vm, el);
    };
  }

  function createElement(tag, data = {}, ...children) {
    let key = data.key;

    if (key) {
      delete data.key;
    }

    return vnode(tag, data, key, children, undefined);
  }
  function createTextNode(text) {
    return vnode(undefined, undefined, undefined, undefined, text);
  }

  function vnode(tag, data, key, children, text) {
    return {
      tag,
      data,
      key,
      children,
      text
    };
  } // 虚拟节点就是通过 _c、_v 实现用对象来描述dom的操作（是一个js对象）

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

  function renderMixin(Vue) {
    // _c 创建元素的虚拟节点
    // _v 创建文本的虚拟节点
    // _s JSON.stringify
    Vue.prototype._c = function () {
      return createElement(...arguments); // arguments: tag attrs child1, child2...
    };

    Vue.prototype._v = function (text) {
      return createTextNode(text);
    };

    Vue.prototype._s = function (val) {
      return val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : val;
    };

    Vue.prototype._render = function () {
      const vm = this;
      const {
        render
      } = vm.$options;
      return render.call(vm);
    };
  }

  // vue 入口文件，只是一个 Vue 的声明，主要功能是整合

  function Vue(options) {
    // 进行 Vue 的初始化操作
    this._init(options);
  } // 把流程拆成一个个原型上的方法，通过引入文件的方式给Vue添加原型上的方法


  initMixin(Vue);
  renderMixin(Vue);
  lifecycleMixin(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
