import { each } from 'lodash';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as prettier from 'prettier';

export = function (api, options) {
  // 删掉之前的所有文件
  api.generator.files = {};
  api.generator.fileMiddlewares.splice(0, api.generator.fileMiddlewares.length);

  api.render('./template');

  // ejs 语法会被 vue cli 内部解析，所以此处需要手动生成 ejs 模板。
  api.render((files) => {
    files['./entry/client.ejs'] = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '    <meta charset="utf-8">',
      '    <link rel="shortcut icon" href="http://www.baidu.com/favicon.ico">',
      '    <title><%= htmlWebpackPlugin.options.title %></title>',
      '</head>',
      '<body>',
      '    <div id="app"></div>',
      '    <script src="/static/js/es6-promise.auto.min.js"></script>',
      '</body>',
      '</html>'
    ].join('\n');
  });

  api.onCreateComplete(() => {
    // 格式化一下 cli 内部生成的配置文件
    const parserMap = {
      'vue.config.js': 'babylon',
      '.babelrc': 'json',
      '.postcssrc': 'json',
      '.eslintrc': 'json',
      'jest.config.js': 'babylon'
    };
    Object.keys(parserMap).forEach((file: string) => {
      const fullPath = api.resolve(file);
      if (existsSync(fullPath)) {
        const prettierConfig = prettier.resolveConfig.sync(fullPath, { editorconfig: true });
        if (prettierConfig !== null) {
          const content = '' + readFileSync(fullPath);
          const formatedContent = prettier.format(content, { ...prettierConfig, parser: parserMap[file] });
          writeFileSync(fullPath, formatedContent);
        }
      }
    });
  });

  const jestConfig = {
    'moduleFileExtensions': [
      'js',
      'jsx',
      'json',
      // tell Jest to handle *.vue files
      'vue'
    ],
    'transform': {
      // process *.vue files with vue-jest
      '^.+\\.vue$': 'vue-jest',
      '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
      '^.+\\.jsx?$': 'babel-jest'
    },
    // support the same @ -> src alias mapping in source code
    'moduleNameMapper': {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    // serializer for snapshots
    'snapshotSerializers': [
      'jest-serializer-vue'
    ],
    'testMatch': [
      '<rootDir>/(tests/unit/**/*.spec.(ts|tsx|js)|**/__tests__/*.(ts|tsx|js))'
    ]
  }

  const veuiVersion = '^1.0.0-alpha.12';
  const pkg = {
    babel: {
      "presets": [
        "@vue/app"
      ],
      "plugins": [
        "lodash",
        "@babel/plugin-proposal-object-rest-spread",
        "@babel/plugin-proposal-class-properties",
        [
          "@babel/plugin-transform-runtime",
          {
            "polyfill": false
          }
        ]
      ]
    },
    postcss: {
      plugins: {
        autoprefixer: {
          browsers: [
            'ie >= 9',
            'last 2 versions'
          ]
        },
        cssnano: {
          autoprefixer: false,
          safe: true
        }
      }
    },
    vue: {
      pluginOptions: {
        'vue-cli-plugin-vue-ria': {
          entries: {
            client: {
              title: '[页面标题]'
            }
          }
        }
      }
    },
    dependencies: {
      'veui': veuiVersion,
      'sfs-vue-ria': '0.0.2',
      'veui-theme-one': veuiVersion,
      'axios': '^0.18.0',
      'moment': '^2.22.1',
      'vuex': '^3.0.1'
    },
    devDependencies: {
      '@babel/plugin-proposal-object-rest-spread': '^7.0.0-beta.46',
      '@babel/plugin-proposal-class-properties': '7.0.0-beta.46',
      'babel-plugin-syntax-jsx': '^6.18.0',
      '@vue/babel-preset-app': '^3.0.0-beta.9',
      'vuex-router-sync': '^5.0.0',
      'ts-loader': '^3.5.0',
      'fork-ts-checker-webpack-plugin': '0.4.1',
      'typescript': '^2.8.3',
      '@vue/eslint-config-airbnb': '^3.0.0-beta.9',
      '@vue/eslint-config-typescript': '^3.0.0-beta.9',
      'babel-jest': '^22.0.4',
      '@vue/test-utils': '^1.0.0-beta.10',
      '@babel/core': '^7.0.0-beta.46',
      'sfs-svg-icons-loader': '^0.0.1',
      'autoprefixer': '^6.7.7',
      'babel-eslint': '^8.2.3',
      'babel-helper-vue-jsx-merge-props': '^2.0.3',
      'babel-loader': '^8.0.0-beta.2',
      'babel-plugin-istanbul': '^4.1.6',
      'babel-plugin-lodash': '^3.3.2',
      '@babel/plugin-syntax-jsx': '^7.0.0-beta.44',
      'babel-plugin-transform-class-properties': '^6.24.1',
      'babel-plugin-transform-decorators-legacy': '^1.3.4',
      '@babel/plugin-transform-runtime': '^7.0.0-beta.46',
      'babel-plugin-transform-vue-jsx': '^3.5.0',
      'chalk': '^2.3.0',
      'copy-webpack-plugin': '^4.2.0',
      'css-loader': '^0.28.7',
      'cssnano': '^3.10.0',
      'eslint': '^4.12.0',
      'eslint-friendly-formatter': '^3.0.0',
      'eslint-import-resolver-webpack': '^0.8.4',
      'eslint-loader': '^1.9.0',
      'eslint-plugin-babel': '^4.1.2',
      'eslint-plugin-import': '^2.8.0',
      'eslint-plugin-vue': '^4.3.0',
      'vue-eslint-parser': '^2.0.3',
      'eventsource-polyfill': '^0.9.6',
      'express': '^4.16.2',
      'extract-text-webpack-plugin': '^3.0.2',
      'file-loader': '^1.1.5',
      'friendly-errors-webpack-plugin': '^1.6.1',
      'html-webpack-plugin': '^2.30.1',
      'http-proxy': '^1.16.2',
      'less': '^2.7.3',
      'less-loader': '^4.0.5',
      'multiparty': '^4.1.3',
      'opn': '^5.1.0',
      'optimize-css-assets-webpack-plugin': '^3.2.0',
      'ora': '^1.3.0',
      'postcss-loader': '^2.0.9',
      'rimraf': '^2.6.2',
      'url-loader': '^0.6.2',
      'vue-style-loader': '^3.0.3',
      'vue-template-compiler': '^2.5.13',
      'webpack-bundle-analyzer': '^2.9.2',
      'webpack-dev-middleware': '^1.12.0',
      'webpack-hot-middleware': '^2.20.0',
      'webpack-merge': '^4.1.1',
      'style-resources-loader': '^1.1.0'
    },
    scripts: {
      test: 'vue-cli-service test',
      dev: api.generator.pkg.scripts.serve
    },
    jest: jestConfig
  };

  return api.extendPackage(pkg);
};
