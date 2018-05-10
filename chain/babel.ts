import babelOptions from '../tool/babelOptions';

export default function babel(api, projectOptions, webpackConfig) {
  webpackConfig.module
    .rule('babel')
      .test(/\.jsx?$/)
      .include
        .add(api.resolve('src'))
        .add(api.resolve('test'))
        .add(api.resolve('node_modules/veui'))
        .add(api.resolve('node_modules/sfs-vue-ria/src'))
        .add(api.resolve('node_modules/veui-theme-one'))
        .add(api.resolve('node_modules/vue-awesome'))
        .add(api.resolve('node_modules/resize-detector'))
        .end()
      .use('babel-loader')
        .loader('babel-loader')
        .options(babelOptions(api));
}
