// vue 入口文件，只是一个 Vue 的声明，主要功能是整合
import { initMixin } from './init'

function Vue(options) {
  // 进行 Vue 的初始化操作
  this._init(options)
}
// 把流程拆成一个个原型上的方法，通过引入文件的方式给Vue添加原型上的方法
initMixin(Vue)
// initRender(Vue)

export default Vue
