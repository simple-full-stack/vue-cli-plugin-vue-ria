import * as eslintFriendlyFormatter from 'eslint-friendly-formatter';

export default function eslint(api, projectOptions, webpackConfig) {
    webpackConfig.module
        .rule('eslint')
            .use('eslint-loader')
                .loader('eslint-loader')
                .tap((options) => {
                    options = {
                        ...(options || {}),
                        "formatter": eslintFriendlyFormatter,
                        "useEslintrc": true,
                        // eslint cache 目前有点 bug ，先关掉
                        "cache": true,
                        "reportUnusedDisableDirectives": true,
                        "extensions": [".js", ".vue"],
                        baseConfig: {
                            settings: {}
                        },
                        rules: {}
                    };
                    options.baseConfig.settings['import/resolver'] = {
                        webpack: {
                            config: webpackConfig.resolve
                        }
                    };
                    options.rules['no-console'] = process.env.NODE_ENV === 'production' ? 1 : 0;
                    return options;
                });
}
