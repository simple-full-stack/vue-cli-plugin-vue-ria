import addEntry from './tool/addEntry';
import proxy from './tool/proxy';
import mockup from './tool/mockup';
import {each} from 'lodash';
import getEnv from './tool/getEnv';
import eslint from './chain/eslint';
import entry from './chain/entry';
import staticAssets from './chain/staticAssets';
import veui from './chain/veui';
import svg from './chain/svg';
import inject from './chain/inject';
import less from './chain/less';
import plugin from './chain/plugin';
import babel from './chain/babel';
import alias from './chain/alias';

export = function (api, projectOptions) {
    const prevBefore = projectOptions.devServer.before;
    projectOptions.devServer.before = function (app) {
        proxy(app, this.proxy);
        mockup(app, api.resolve.bind(api));

        if (typeof prevBefore === 'function') {
            prevBefore(app);
        }
    };

    api.chainWebpack((webpackConfig) => {
        eslint(api, projectOptions, webpackConfig);
        entry(api, projectOptions, webpackConfig);
        staticAssets(api, projectOptions, webpackConfig);
        veui(api, projectOptions, webpackConfig);
        svg(api, projectOptions, webpackConfig);
        inject(api, projectOptions, webpackConfig);
        less(api, projectOptions, webpackConfig);
        babel(api, projectOptions, webpackConfig);
        plugin(api, projectOptions, webpackConfig);
        alias(api, projectOptions, webpackConfig);

        webpackConfig.devtool('eval-source-map');
    });
};
