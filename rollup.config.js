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
