import rules from './rules';
import proxy from './tool/proxy';
import mockup from './tool/mockup';

export default function (api, {entry = ''} = {}) {
    const entryList = entry.trim().split(/\s+/);

    api.render('./template');

    const pkg = {
        eslintConfig: {
            root: true,
            rules: rules,
            parser: 'vue-eslint-parser',
            parserOptions: {
                parser: 'babel-eslint',
                ecmaVersion: 2018,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                    experimentalObjectRestSpread: true,
                    impliedStrict: true
                }
            },
            env: {browser: true},
            globals: {Promise: true, process: true},
            plugins: [
                'babel',
                'import',
                'vue'
            ]
        },
        babel: {
            plugins: [
                'veui',
                'lodash',
                'transform-class-properties'
            ]
        },
        postcss: {
            "plugins": {
                "autoprefixer": {},
                "cssnano": {
                    "autoprefixer": false,
                    "safe": true
                }
            }
        },
        vue: {
            pluginOptions: {
                entries: {
                    client: {
                        title: '[页面标题]'
                    }
                }
            },
            devServer: {
                before(app) {
                    proxy(app, this.proxy);
                    mockup(app, api.resolve.bind(api));
                }
            }
        },
        dependencies: {
            'veui': '^1.0.0-alpha.9',
            've-ria': '^1.0.0-alpha.8'
        },
        devDependencies: {
            'eslint-plugin-babel': '^4.1.2',
            'eslint-plugin-import': '^2.9.0',
            'babel-plugin-veui': '^1.0.0-alpha.9',
            'veui-loader': '1.0.0-alpha.9',
            'babel-plugin-lodash': '^3.3.2',
            'babel-plugin-transform-class-properties': '^6.24.1'
        }
    };

    return api.extendPackage(pkg);
};
