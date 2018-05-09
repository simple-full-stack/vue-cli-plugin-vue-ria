import * as webpack from 'webpack';
import * as FriendlyErrorsPlugin from 'friendly-errors-webpack-plugin';
import getEnv from '../tool/getEnv';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import * as OptimizeCSSPlugin from 'optimize-css-assets-webpack-plugin';
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';

export default function plugin(api, projectOptions, webpackConfig) {
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
            .use(webpack.DefinePlugin, [getEnv()]);
        webpackConfig.plugin('notEmitErrors')
            .use(webpack.NoEmitOnErrorsPlugin);
        webpackConfig.plugin('friendlyError')
            .use(FriendlyErrorsPlugin);
    } else if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugin('define')
            .use(webpack.DefinePlugin, [getEnv()]);
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
                        return (
                            module.resource &&
                            /\.js$/.test(module.resource) &&
                            module.resource.indexOf(
                                this.resolve('node_modules')
                            ) === 0
                        );
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
        webpackConfig.plugin('analyzer').use(BundleAnalyzerPlugin);
    }
}
