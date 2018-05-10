export default function svg(api, projectOptions, webpackConfig) {
    webpackConfig.module
        .rule('svg')
            .exclude
                .add(api.resolve('assets/icons'))
                .add(api.resolve('node_modules/sfs-vue-ria/src/assets'))
                .add(api.resolve('src/common/sfs-vue-ria/src/assets'))
                .add(api.resolve('node_modules/veui-theme-one/assets'))
                .end();

    webpackConfig.module
        .rule('svg-no-color')
            .test(/\.svg$/)
            .include
                .add(api.resolve('assets/icons'))
                .add(api.resolve('node_modules/sfs-vue-ria/src/assets'))
                .add(api.resolve('src/common/sfs-vue-ria/src/assets'))
                .add(api.resolve('node_modules/veui-theme-one/assets'))
                .end()
            .use('svg-no-color')
                .loader('sfs-svg-icons-loader')
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
                .loader('sfs-svg-icons-loader')
                .options({clearAllColor: true});
}
