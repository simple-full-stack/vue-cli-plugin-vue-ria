"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
const FriendlyErrorsPlugin = require("friendly-errors-webpack-plugin");
const getEnv_1 = require("../tool/getEnv");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const OptimizeCSSPlugin = require("optimize-css-assets-webpack-plugin");
const webpack_bundle_analyzer_1 = require("webpack-bundle-analyzer");
function plugin(api, projectOptions, webpackConfig) {
    const pluginOptions = projectOptions.pluginOptions[require('./package.json').name];
    [
        'preload',
        'prefetch',
        'html',
        'split-vendor',
        'split-manifest',
        'inline-manifest',
        'split-vendor-async'
    ].forEach(name => {
        webpackConfig.plugins.delete(name);
    });
    if (process.env.NODE_ENV === 'development') {
        webpackConfig.plugin('define')
            .use(webpack.DefinePlugin, [getEnv_1.default()]);
        webpackConfig.plugin('notEmitErrors')
            .use(webpack.NoEmitOnErrorsPlugin);
        webpackConfig.plugin('friendlyError')
            .use(FriendlyErrorsPlugin);
    }
    else if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugin('define')
            .use(webpack.DefinePlugin, [getEnv_1.default()]);
        webpackConfig.plugin('uglify')
            .use(webpack.optimize.UglifyJsPlugin, [{
                compress: {
                    warnings: false
                },
                sourceMap: false
            }]);
        webpackConfig.plugin('extract')
            .use(ExtractTextPlugin, [{
                filename: './static/css/[name].[contenthash].css'
            }]);
        webpackConfig.plugin('optimizeCSS')
            .use(OptimizeCSSPlugin, [{
                cssProcessorOptions: {
                    safe: true
                }
            }]);
        webpackConfig.plugin('optimizeChunkVendor')
            .use(webpack.optimize.CommonsChunkPlugin, [
            {
                name: 'vendor',
                minChunks: (module) => {
                    // any required modules inside node_modules are extracted to vendor
                    return (module.resource &&
                        /\.js$/.test(module.resource) &&
                        module.resource.indexOf(this.resolve('node_modules')) === 0);
                }
            }
        ]);
        webpackConfig.plugin('optimizeChunkManifest')
            .use(webpack.optimize.CommonsChunkPlugin, [
            {
                name: 'manifest',
                chunks: ['vendor']
            }
        ]);
    }
    if (pluginOptions.bundleAnalyzerReport) {
        webpackConfig.plugin('analyzer').use(webpack_bundle_analyzer_1.BundleAnalyzerPlugin);
    }
}
exports.default = plugin;
