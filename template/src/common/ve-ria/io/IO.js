/**
 * @file 请求发送器
 * @author Justineo(justice360@gmail.com), Chestnut, yibuyisheng
 */
import axios from 'axios';
import {isFunction, isUndefined} from 'lodash';
import {purify} from '../utils/lang';
import qs from 'qs';

/**
 * 后端返回的结果代码对应的类型
 *
 * @const {string}
 *
 * eslint-disable Pascal-case
 */
let CodeType = {
    0: 'SUCCESS',
    1: 'GLOBAL',
    2: 'FIELD',
    3: 'REDIRECT',
    4: 'NO_SESSION'
};

/**
 * 最小的自定义错误代码
 * 小于此代码的均保留为预定义类型，大于等于此代码作为自定义处理
 *
 * @const {number}
 */
const MINIMAL_CUSTOM_FAIL_CODE = 100;

/**
 * 生成全局错误对象
 *
 * @param {string} message 错误提示信息
 * @return {Object} 全局错误对象
 */
function getGlobalError(message) {
    return {
        success: false,
        message: {
            global: message
        }
    };
}

export default class IO {
    static getGlobalError = getGlobalError;
    static SERVER_ERROR = getGlobalError('服务器错误');
    static PARSE_ERROR = getGlobalError('数据解析失败');
    static SCHEMA_ERROR = getGlobalError('数据格式错误');
    static UNKNOWN_ERROR = getGlobalError('未知错误');
    static NETWORK_ERROR = getGlobalError('网络错误');

    /**
     * 常规请求流程中的hook如下：
     *
     * io.request(configs)
     *   │
     *   ├───── io.hooks.beforeRequest(configs) ───┐
     *   │                                         │
     *   │<────────────── configs ─────────────────┘
     *   │
     *   ├───── io.hooks.afterResponse(data) ───┐
     *   │                                      │
     *   │<────────────── data ─────────────────┘
     *   │
     *   └─────────────────┐
     *   ┌──── success ────♦──── failure ────┐
     *   │                                   │
     *   ├─ io.hooks.afterSuccess(response) ─┐   ├─ io.hooks.afterFailure(error) ─┐
     *   │                               │   │                                    │
     *   │<──────────── data ────────────┘   │  <───────────── message ───────────┘
     *   │                                   │
     *   ├───────────────────────────────────┘
     *   ●
     *
     * 其中，afterResponse 、 afterSuccess 、 afterFailure 在 Nmp 子类中实现。
     */
    hooks = {};
    isHooksActived = false;

    axios = axios.create({
        responseType: 'json'
    });

    constructor() {
        this.axios.interceptors.request.use(
            (...args) => this.beforeRequest(...args)
        );
        this.axios.interceptors.response.use(
            response => {
                // IE9 不支持 responseType 配置，所以 response.data 始终都不会存在，
                // 只能手动从 response.request.responseText 中 parse 了。
                let data = response.data || JSON.parse(response.request.responseText);
                return this.requestSuccessHandler(data);
            },
            (...args) => this.requestFailureHandler(...args)
        );
    }

    beforeRequest(options) {
        return this.callHook('beforeRequest', options) || options;
    }

    /**
     * 调用 this.hooks 中的钩子函数
     *
     * @protected
     */
    callHook(name, ...args) {
        return isFunction(this.hooks[name]) ? this.hooks[name](...args) : undefined;
    }

    /**
     * 请求成功的时候调用
     *
     * @protected
     */
    requestSuccessHandler(response) {}

    /**
     * 请求失败的时候调用
     *
     * @protected
     */
    requestFailureHandler() {}

    /**
     * 适配新NMP接口返回的结果
     *
     * @param {Object} data 后端返回的数据对象
     * @return {Object} 转换过后符合前端逻辑的对象
     */
    prepareResponse(data) {
        if (!isUndefined(data.code)) { // 有code时认为是新版接口
            let status = CodeType[data.code];

            if (!status) {
                if (data.code < MINIMAL_CUSTOM_FAIL_CODE) { // 非预定义类型，未知错误
                    return IO.UNKNOWN_ERROR;
                }

                // 自定义类型错误
                let message = data.message || {};
                message.code = data.code;
                return {
                    success: false,
                    message: message
                };
            }

            if (status === 'SUCCESS') {
                let result = {
                    success: true,
                    message: data.message,
                    result: data.result || data.page
                };

                return purify(result);
            }

            return {
                success: false,
                message: data.message
            };
        }

        if (!isUndefined(data.success)) {
            return data;
        }

        return IO.SCHEMA_ERROR;
    }

    /**
     * 向服务端发起请求
     *
     * @public
     * @param {...Object} args 参数
     * @return {Promise.<Object>}
     */
    request(...args) {
        return this.axios.request(...args);
    }

    /**
     * 以GET方式向服务端发起请求
     *
     * @public
     * @param {...Object} args 参数
     * @return {Promise.<Object>}
     */
    get(...args) {
        return this.axios.get(...args);
    }

    /**
     * 以POST方式向服务端发起请求
     *
     * @public
     * @param {string} url 路径
     * @param {Object} data 参数
     * @param {Object} configs 配置
     * @return {Promise.<Object>}
     */
    post(url, data, configs) {
        return this.axios.post(url, qs.stringify(data), configs);
    }
}
