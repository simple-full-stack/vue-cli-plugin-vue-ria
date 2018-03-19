/**
 * @file FormModel
 * @author Chestnut(chenli11@baidu.com)
 */

import BaseModel from './BaseModel';
import {assign, last, mapValues, cloneDeep, isUndefined} from 'lodash';
import {purify} from '../utils/lang';

export default class ListModel extends BaseModel {
    /**
     * 页面的标题
     *
     * @type {string}
     */
    title = '表单';

    /**
     * 表单详情请求器
     *
     * @type {Function}
     */
    detailRequester = null;

    /**
     * 表单数据提交
     */
    createRequester = null;

    /**
     * 表单数据更新
     */
    updateRequester = null;

    /**
     * 透传给form的属性
     *
     * @type {Object}
     */
    formSetting = {
        beforeValidate: null,
        afterValidate: null,
        disabled: null,
        readonly: null,
        validators: null
    };

    pageType = null;
    formData = {};

    successToast = '提交成功';
    failToast = '提交失败';

    id = null;

    /**
     * @override
     */
    init() {
        super.init();

        const path = this.getRoutePath();
        const pageType = last(path.split('/'));
        this.pageType = pageType;

        const query = this.getRouteQuery({});
        if (query.id) {
            this.id = query.id;
        }
    }

    /**
     * 初始化时获取表单数据
     *
     * @public
     */
    initFormData() {
        if (this.detailRequester) {
            this.requestDetail();
        }
    }

    /**
     * 准备提交数据
     *
     * @protected
     * @param {Object} formData 表单数据
     * @return {Object}
     */
    prepareData(formData) {
        return this.formData;
    }

    /**
     * 默认查询参数
     *
     * @protected
     * @return {Object}
     */
    getDefaultArgs() {
        let id = this.id;
        return id ? {id} : {};
    }

    /**
     * 提前处理后端返回的数据
     * 以formData现有定义做为填充范围及默认数据，抛弃掉后端数据不在formData中的数据及无定义数据
     *
     * @protected
     * @param {Object} data 后端返回的数据
     * @return {Object}
     */
    adaptData(data) {
        return mapValues(this.formData, (value, key) => (isUndefined(data[key]) ? value : data[key]));
    }

    /**
     * 请求详情
     *
     * @public
     * @param {Object} params 请求参数
     * @param {Object} config 配置参数
     * @return {Promise}
     */
    async requestDetail(params = {}, config = {}) {
        const data = await this.detailRequester(
            purify(assign({}, this.getDefaultArgs(), params)),
            config
        );
        assign(this.formData, this.adaptData(data));
        // 把完整的 data 返回出去
        return data;
    }

    /**
     * 创建表单
     *
     * @param {Object} formData 表单提交数据
     * @param {Object} config 配置
     * @return {Promise}
     */
    requestCreate(formData = {}, config = {}) {
        return this.createRequester(this.prepareData(cloneDeep(formData)), config);
    }

    /**
     * 创建表单
     *
     * @param {Object} formData 表单提交数据
     * @param {Object} config 配置
     * @return {Promise}
     */
    requestUpdate(formData = {}, config = {}) {
        return this.updateRequester(this.prepareData(cloneDeep(formData)), config);
    }

    /**
     * 提交。
     * 对于非 create 、 edit 类型 form 页面，子类必须覆盖此方法，去做处理。
     *
     * @protected
     * @param {Object} data 要提交的数据
     * @return Promise
     */
    submit(data) {
        if (this.pageType === 'create' && this.createRequester) {
            return this.requestCreate(data);
        }

        if (this.pageType === 'edit' && this.updateRequester) {
            return this.requestUpdate(data);
        }

        throw new Error(`unknown form page type: ${this.pageType}!`);
    }

    // 表单验证失败回调
    invalid() {}

    // 提交成功回调
    success() {}

    // 提交失败回调
    fail() {}
}
