import addEntry from './tool/addEntry';

function eslint(api, projectOptions, webpackConfig) {
    webpackConfig.module
        .rule('eslint')
            .use('eslint-loader')
                .loader('eslint-loader')
                .tap(options => {
                    options.rules = options.rules || {};
                    options.rules['no-console'] = process.env.NODE_ENV === 'production' ? 1 : 0;
                    return options;
                });
}

function entry(api, projectOptions, webpackConfig) {
    const entries = projectOptions.entries;
    if (!entries || !entries.length) {
        throw new Error('No entry.');
    }
    projectOptions.entries.forEach((config, name) => {
        addEntry(webpackConfig, name, api.resolve.bind(api));
    });
}

function staticAssets(api, projectOptions, webpackConfig) {
    if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugin('copy').tap(() => [[{
            from: api.resolve('static'),
            to: api.resolve('dist/static'),
            ignore: ['.*']
        }]]);
    }
}

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

function svg(api, projectOptions, webpackConfig) {
    webpackConfig.module
        .rule('svg')
            .exclude
                .add(api.resolve('assets/icons'))
                .add(api.resolve('node_modules/ve-ria/assets'))
                .add(api.resolve('src/common/ve-ria/assets'))
                .add(api.resolve('node_modules/veui-theme-one/assets'))
                .end();

    webpackConfig.module
        .rule('svg-no-color')
            .test(/\.svg$/)
            .include
                .add(api.resolve('assets/icons'))
                .add(api.resolve('node_modules/ve-ria/assets'))
                .add(api.resolve('src/common/ve-ria/assets'))
                .add(api.resolve('node_modules/veui-theme-one/assets'))
                .end()
            .use('svg-no-color')
                .loader('@baidu/svg-icons-loader')
                .options({clearAllColor: true});

    webpackConfig.module
        .rule('svg-no-color')
            .test(/\.svg$/)
            .include
                .add(api.resolve('assets'))
                .end()
            .exclude
                .add(api.resolve('assets/icons'))
                .end()
            .use('svg-no-color')
                .loader('@baidu/svg-icons-loader')
                .options({clearAllColor: true});
}

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

function less(api, projectOptions, webpackConfig) {
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

export default function (api, projectOptions) {
    api.chainWebpack((webpackConfig) => {
        eslint(api, projectOptions, webpackConfig);
        entry(api, projectOptions, webpackConfig);
        staticAssets(api, projectOptions, webpackConfig);
        veui(api, projectOptions, webpackConfig);
        svg(api, projectOptions, webpackConfig);
        inject(api, projectOptions, webpackConfig);
        less(api, projectOptions, webpackConfig);

        webpackConfig.devtool('cheap-eval-source-map');
    });
};
