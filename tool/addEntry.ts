import getEntryTemplate from './getEntryTemplate';
import getEnv from './getEnv';

export default function addEntry(webpackConfig, name, resolve, config) {
    webpackConfig.entry(name).add(resolve(`src/${name}/main.js`)).end();

    if (process.env.NODE_ENV === 'development') {
        webpackConfig.plugin(`html-${name}`).use(
            require('html-webpack-plugin'),
            [
                {
                    title: config.title,
                    filename: `${name}/index.html`,
                    template: getEntryTemplate(name, resolve),
                    inject: true,
                    chunks: [name],
                    env: getEnv()
                }
            ]
        );
    } else if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugin(`html-${name}`).use(
            require('html-webpack-plugin'),
            [
                {
                    title: config.title,
                    filename: `${name}/index.html`,
                    template: getEntryTemplate(name, resolve),
                    inject: true,
                    minify: {
                        removeComments: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true
                        // more options:
                        // https://github.com/kangax/html-minifier#options-quick-reference
                    },
                    chunks: ['manifest', 'vendor', name],
                    chunksSortMode: 'dependency',
                    env: getEnv()
                }
            ]
        );
    }

    return webpackConfig;
}
