import addEntry from './tool/addEntry';
import proxy from './tool/proxy';
import mockup from './tool/mockup';
import {each} from 'lodash';
import getEnv from './tool/getEnv';
import eslint from './chain/eslint';
import entry from './chain/entry';
import staticAssets from './chain/staticAssets';
import svg from './chain/svg';
import inject from './chain/inject';
import less from './chain/less';
import plugin from './chain/plugin';
import babel from './chain/babel';
import alias from './chain/alias';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import babelOptions from './tool/babelOptions';

function vue(api, projectOptions, webpackConfig) {
  webpackConfig.module.rules.delete('vue');

  const baseLessLoaders = [
    {
      loader: 'css-loader'
    },
    {
      loader: 'postcss-loader'
    },
    {
      loader: 'less-loader'
    }
  ];

  webpackConfig.module.rule('vue')
    .test(/\.vue$/)
    .use('vue-loader')
      .loader('vue-loader')
      .options({
        preserveWhitespace: false,
        loaders: {
          ts: `babel-loader?${JSON.stringify(babelOptions(api))}!ts-loader`,
          js: `babel-loader?${JSON.stringify(babelOptions(api))}`,
          less: process.env.NODE_ENV === 'development' ? [
            {loader: 'vue-style-loader'},
            ...baseLessLoaders
          ] : ExtractTextPlugin.extract({
            use: baseLessLoaders,
            fallback: 'vue-style-loader'
          })
        }
      });
}

function ts(api, projectOptions, webpackConfig) {
  webpackConfig.resolve.extensions.merge(['.ts', '.tsx', '.d.ts']);
  webpackConfig.module.rule('ts')
    .test(/\.tsx?$/)
    .use('babel-loader')
      .loader('babel-loader')
      .options(babelOptions(api))
      .end()
    .use('ts-loader')
      .loader('ts-loader');
}

export = function (api, projectOptions) {
    const prevBefore = projectOptions.devServer.before;
    projectOptions.devServer.before = function (app) {
        proxy(app, this.proxy);
        mockup(app, api.resolve.bind(api));

        if (typeof prevBefore === 'function') {
            prevBefore(app);
        }
    };

    api.chainWebpack((webpackConfig) => {
        eslint(api, projectOptions, webpackConfig);
        entry(api, projectOptions, webpackConfig);
        staticAssets(api, projectOptions, webpackConfig);
        svg(api, projectOptions, webpackConfig);
        inject(api, projectOptions, webpackConfig);
        less(api, projectOptions, webpackConfig);
        babel(api, projectOptions, webpackConfig);
        plugin(api, projectOptions, webpackConfig);
        alias(api, projectOptions, webpackConfig);
        ts(api, projectOptions, webpackConfig);
        vue(api, projectOptions, webpackConfig);

        webpackConfig.devtool('eval-source-map');
    });
};
