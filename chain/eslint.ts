import * as eslintFriendlyFormatter from 'eslint-friendly-formatter';

export default function eslint(api, projectOptions, webpackConfig) {
  const options = {
    "formatter": eslintFriendlyFormatter,
    "useEslintrc": true,
    // eslint cache 目前有点 bug ，先关掉
    "cache": true,
    "reportUnusedDisableDirectives": true,
    "extensions": [".js", ".vue"],
    baseConfig: {
      settings: {}
    },
    rules: {}
  };

  options.baseConfig.settings['import/resolver'] = {
    webpack: {
        config: webpackConfig.resolve.toConfig()
    }
  };
  options.rules['no-console'] = process.env.NODE_ENV === 'production' ? 1 : 0;

  webpackConfig.module
    .rule('eslint')
    .pre()
    .include
      .add(api.resolve('src'))
      .add(api.resolve('tests'))
      .end()
    .test(/\.(vue|(j|t)sx?)$/)
    .use('eslint-loader')
      .loader('eslint-loader')
      .options(options)
}
