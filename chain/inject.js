"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function inject(api, projectOptions, webpackConfig) {
    webpackConfig.module
        .rule('vue')
        .use('vue-loader')
        .tap(options => {
        options.loaders.less.push({
            loader: 'style-resources-loader',
            options: {
                patterns: [api.resolve('src/common/css/inject.less')],
                injector: 'append'
            }
        });
        return options;
    });
}
exports.default = inject;
