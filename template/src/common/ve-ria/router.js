/**
 * @file 生成系统路由
 * @author Chestnut
 */

import Vue from 'vue';
import Router from 'vue-router';
import {pick, assign} from 'lodash';

Vue.use(Router);

function normalizeRouteConfig(routes) {
    routes.forEach(route => {
        route.meta = assign({}, route.meta, pick(route, 'auth'));

        if (route.children) {
            normalizeRouteConfig(route.children);
        }
    });
}

export default {
    init(localRoutes = []) {
        normalizeRouteConfig(localRoutes);

        return new Router({
            routes: localRoutes
        });
    }
};
