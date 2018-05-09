export default function staticAssets(api, projectOptions, webpackConfig) {
    webpackConfig.plugin('copy').tap(() => [[{
        from: api.resolve('static'),
        to: api.resolve('dist/static'),
        ignore: ['.*']
    }]]);
}
