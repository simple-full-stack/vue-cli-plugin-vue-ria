"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const addEntry_1 = require("../tool/addEntry");
function entry(api, projectOptions, webpackConfig) {
    const entries = projectOptions.pluginOptions[require('./package.json').name].entries;
    if (!entries || !Object.keys(entries).length) {
        throw new Error('No entry.');
    }
    webpackConfig.entryPoints.delete('app');
    lodash_1.each(entries, (config, name) => {
        addEntry_1.default(webpackConfig, name, api.resolve.bind(api), config);
    });
}
exports.default = entry;
