"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function veui(api, projectOptions, webpackConfig) {
    webpackConfig.module
        .rule('veui')
        .test(/\.vue$/)
        .pre()
        .include
        .add(api.resolve('node_modules/veui'))
        .end()
        .use('veui')
        .loader('veui-loader')
        .options({
        modules: [
            {
                package: 'veui-theme-one',
                fileName: '${module}.less'
            },
            {
                package: 'veui-theme-one',
                fileName: '${module}.js',
                transform: false
            }
        ]
    });
    webpackConfig.module
        .rule('js')
        .include
        .add(api.resolve('node_modules/veui'));
}
exports.default = veui;
