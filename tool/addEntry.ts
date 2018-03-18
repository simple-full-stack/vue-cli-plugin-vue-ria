import getEntryTemplate from './getEntryTemplate';

export default function addEntry(webpackConfig, name, resolve) {
    webpackConfig.entry(name).add(resolve(`src/${name}/main.js`)).end();

    webpackConfig.plugin(`html-${name}`).use(
        require('html-webpack-plugin'),
        [
            {
                filename: `${name}/index.html`,
                template: getEntryTemplate(name, resolve),
                inject: true,
                chunksSortMode: 'dependency'
            }
        ]
    );

    if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugin(`html-${name}`).tap(([options]) => [Object.assign(options, {
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true
            }
        })]);
    }

    return webpackConfig;
}
