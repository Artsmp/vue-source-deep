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

  class Observer {
    constructor(value) {
      // 需要递归遍历深层次对象
      this.walk(value);
    }

    walk(data) {
      let keys = Object.keys(data); // [name, age, address]

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
