"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function staticAssets(api, projectOptions, webpackConfig) {
    webpackConfig.plugin('copy').tap(() => [[{
                from: api.resolve('static'),
                to: api.resolve('dist/static'),
                ignore: ['.*']
            }]]);
}
exports.default = staticAssets;
