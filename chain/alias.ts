import {each} from 'lodash';

export default function alias(api, projectOptions, webpackConfig) {
    const pluginOptions = projectOptions.pluginOptions[require('../package.json').name];
    const extraAlias = pluginOptions.extraAlias || {};
    each(extraAlias, (val, key) => {
        webpackConfig.resolve.alias.set(key, val);
    });
    if (process.env.NODE_ENV === 'production') {
        webpackConfig.resolve.alias.set('vue$', 'vue/dist/vue.runtime.esm.js');
    } else {
        webpackConfig.resolve.alias.set('vue$', 'vue/dist/vue.esm.js');
    }
}
