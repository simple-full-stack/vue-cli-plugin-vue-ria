"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function alias(api, projectOptions, webpackConfig) {
    const pluginOptions = projectOptions.pluginOptions[require('./package.json').name];
    const extraAlias = pluginOptions.extraAlias || {};
    lodash_1.each(extraAlias, (val, key) => {
        webpackConfig.resolve.alias.set(key, val);
    });
    if (process.env.NODE_ENV === 'production') {
        webpackConfig.resolve.alias.set('vue$', 'vue/dist/vue.runtime.esm.js');
    }
    else {
        webpackConfig.resolve.alias.set('vue$', 'vue/dist/vue.esm.js');
    }
}
exports.default = alias;
