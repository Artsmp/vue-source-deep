(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

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

  } // 把 data 数据都使用 Object.defineProperty 重新定义（不能兼容 IE8 及以下）


  function observe(data) {
    if (!isObj(data)) {
      return;
    }

    return new Observer(data);
  }

  function defineReactive(data, key, value) {
    console.log('==>data, key, value', data, key, value);
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

    observe(data); // 响应式原理
  }

  function initMixin(Vue) {
    // 初始化流程
    Vue.prototype._init = function (options) {
      // 1. 数据的劫持
      const vm = this;
      vm.$options = options; // this.$options 指代的就是用户传递的属性
      // 初始化状态(vue的数据来源)

      initState(vm);
    };
  }

  // vue 入口文件，只是一个 Vue 的声明，主要功能是整合

  function Vue(options) {
    // 进行 Vue 的初始化操作
    this._init(options);
  } // 把流程拆成一个个原型上的方法，通过引入文件的方式给Vue添加原型上的方法


  initMixin(Vue); // initRender(Vue)

  return Vue;

}));
//# sourceMappingURL=vue.js.map
