export default function less(api, projectOptions, webpackConfig) {
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
