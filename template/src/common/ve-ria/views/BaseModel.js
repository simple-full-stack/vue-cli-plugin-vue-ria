/**
 * @file BaseModel
 * @author zhangli25(zhangli25@baidu.com)
 */
import Vue from 'vue';
import {assign, get} from 'lodash';

export default class BaseModel {
    /**
     * 全局数据管理模块，在 Model 初始化的时候传入
     *
     * @protected
     */
    global = null;

    /**
     * 标题
     *
     * @type {string}
     */
    title = '标题';

    /**
     * 面包屑分隔符
     *
     * @type {string}
     */
    crumbSeparator = 'angle-right-small';

    /**
     * 默认回退到的 url
     *
     * @type {string|object}
     */
    defaultBackURL = null;

    /**
     * 构造器
     *
     * @public
     * @param {GlobalModel} globalModel 全局模块
     */
    constructor(globalModel) {
        this.global = globalModel;
    }

    /**
     * 初始化
     *
     * @public
     */
    init() {
        this.api = this.global.config.api;
    }

    getConstant(key) {
        return this.global.constants.get(key);
    }

    getConstantMap(key) {
        return this.global.constants.getMap(key);
    }

    getConstantDatasource(key) {
        return this.global.constants.getDatasource(key);
    }

    $set(...args) {
        Vue.set(...args);
    }

    set(...args) {
        Vue.set(this, ...args);
    }

    getRouteQuery(dft) {
        return this.global.router.currentRoute.query || dft;
    }

    getRoutePath() {
        return this.global.router.currentRoute.path;
    }

    getRouteFullPath() {
        return this.global.router.currentRoute.fullPath;
    }

    back(url) {
        url = url || this.getRouteQuery().fromu || this.defaultBackURL || this.global.fromu;
        if (!url || url === 'BACK_NULL' || url === 'INIT_URL') {
            throw new Error('can not find a suitable back URL.');
        }

        this.global.redirect({url, type: 'push'});

        // 跳完了之后，清空一下 this.global.fromu ，防止影响后续跳转
        this.global.fromu = 'BACK_NULL';
    }

    getVisitor() {
        return this.global.user.getVisitor();
    }

    getAder() {
        return this.global.user.getAder();
    }

    /**
     * 将后端的上传接口报错转换成 Uploader 组件能处理的样子
     *
     * @param {Object} response 后端返回 JSON 数据
     */
    convertUploadResponse(response) {
        const data = this.global.nmp.prepareResponse(response);

        const uploaderResult = {};
        if (data.success + '' !== 'true') {
            uploaderResult.status = 'failure';
            uploaderResult.reason = get(response, 'message.global', '未知错误');
        }
        else {
            uploaderResult.status = 'success';
        }

        assign(response, uploaderResult);
    }
}
