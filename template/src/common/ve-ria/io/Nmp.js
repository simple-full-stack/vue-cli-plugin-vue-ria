/**
 * @file Nmp
 * @author yibuyisheng(yibuyisheng@163.com)
 */
import IO from './IO';
import loc from '../location';
import {isUndefined, assign, isFunction, isObject, isString, extend, clone} from 'lodash';
import alertManager from 'veui/managers/alert';
import uri from '../utils/uri';

export default class Nmp extends IO {
    waitForRedirect = false;

    /**
     * 跳转到主页
     *
     * @private
     */
    gotoIndex() {
        let url = '/index.html';
        url = this.callHook('filterIndexUrl', url) || url;
        loc.assign(url);
    }

    /**
     * 激活扩展
     *
     * @param {User} user 用户信息
     * @param {Object} options 需要启用的钩子扩展，默认为都启用，键名为钩子名称，键值为falsy值时禁用
     */
    activeHook(user, options = {}) {
        if (this.isHooksActived) {
            return;
        }

        /**
         * 可用的钩子名称如下：
         * - ADD_ADER_ID
         * - ADD_ER_REQUEST_HEADER
         *
         * 默认全部启用
         */
        const hooks = {
            ADD_ADER_ID: true,
            ADD_ER_REQUEST_HEADER: true
        };

        // 设定默认值
        assign(hooks, options);

        if (hooks.ADD_ADER_ID) {
            this.hooks.filterIndexUrl = function (url) {
                return uri.withQuery(url, user.getAderArgMap());
            };
        }

        this.hooks.beforeRequest = function (configs) {
            if (hooks.ADD_ADER_ID) {
                let url = configs.url;
                let argMap = user.getAderArgMap();
                if (argMap) {
                    configs.url = uri.withQuery(url, argMap);
                }
            }

            return configs;
        };

        if (hooks.ADD_ER_REQUEST_HEADER) {
            this.axios.defaults.headers.common['X-Request-By'] = 'ERApplication';
        }

        this.isHooksActived = true;
    }

    /**
     * 处理服务端响应成功的情况
     *
     * @private
     * @param {Object} response 后端响应
     * @return {meta.Promise} 处理后的Promise
     */
    requestSuccessHandler(response) {
        // 如果是并发请求，session超时会导致连续弹好几个，还是处理一下比较好
        // fixme 我觉得 global error 也应该处理一下？连续两个 global error 是不是可以隐藏
        if (this.waitForRedirect) {
            return Promise.reject('超时重定向中');
        }

        let data = this.prepareResponse(response);
        data = this.callHook('afterResponse', data) || data;

        if ((data.success + '') !== 'true') {
            let message = data.message;
            let title;
            let content;
            let onok;
            let needAlert = true;

            if (!isUndefined(message.global)) {
                title = '系统提示';
                content = message.global;
            }
            else if (!isUndefined(message.noSession)) {
                this.waitForRedirect = true;
                title = '系统超时';
                content = message.noSession;
                onok = this.gotoIndex;
            }
            else if (!isUndefined(message.redirect)) {
                if (message.redirect === '') {
                    this.waitForRedirect = true;
                    title = '登录超时';
                    content = '登录超时，请重新登录！';
                    onok = function () {
                        loc.reload(true);
                    };
                }
                else {
                    loc.assign(message.redirect);
                    return;
                }
            }
            else if (!isUndefined(message.field) || !isUndefined(message.code)) {
                // 字段错误不需要弹窗提示，直接在表单中处理
                // 自定义错误也在后面的过程中自行处理
                needAlert = false;
            }
            else { // last resort
                title = '系统提示';
                content = '未知错误';
            }

            if (needAlert) {
                alertManager.error(content, title, {ok: onok});
            }

            message = this.callHook('afterFailure', message) || message;
            message = this.requestCompleteHandler(message) || message;

            return Promise.reject(message);
        }

        // 成功状态
        data = this.callHook('afterSuccess', data) || data;
        let result = data.page || data.result;
        result = this.requestCompleteHandler(result) || result;
        return Promise.resolve(result);
    }

    /**
     * 处理服务端响应失败的情况
     * 转换为成功响应，返回错误提示处理
     *
     * @private
     * @param {meta.Promise} result 响应的Promise
     * @return {meta.Promise} 处理后的Promise
     */
    requestFailureHandler(result = {}) {
        let error;
        if (result.response) {
            let status = result.response.status;

            if (status < 200 || (status >= 300 && status !== 304)) { // 服务器没有正常返回
                error = Nmp.SERVER_ERROR;
            }
            else {
                error = Nmp.PARSE_ERROR;
            }
        }
        else if (result.message) {
            error = Nmp.getGlobalError(result.message);
        }
        else {
            error = Nmp.NETWORK_ERROR;
        }

        return this.requestSuccessHandler(error);
    }

    /**
     * 处理服务端响应完成的情况
     * 不管成功失败均执行
     *
     * @private
     * @param {Object|meta.Promise} data 成功时为返回的数据对象，失败时为请求Promise
     * @return {Mixed} 处理后的输入参数
     */
    requestCompleteHandler(data) {
        data = this.callHook('afterComplete', data) || data;
        return data;
    }

    /**
     * 根据URL字符串生成请求发送器
     *
     * 传入一个字符串时，只返回一个发送器函数；传入数组或对象时，递归；传入函数时
     *
     * url在配置中的格式是 "[method]|[path]"
     *
     * @public
     * @param {string|Array.<string>|Object.<string, string>|Function} url 请求路径或多个请求路径的集合，或是取值函数
     * @param {function(string):boolean} isRequester 判断是否是需要生成请求发送器的路径
     * @return {Function|Array.<Function>|Object.<string, Function>} 将对应的路径转换为发送器后返回
     */
    genRequesters(url, isRequester) {
        if (isString(url)) {
            // 只有一个URL，直接返回封装过的请求方法
            let urlInfo = url.split('|');
            let method = urlInfo.length > 1 ? urlInfo[0] : 'post';
            url = urlInfo[1] || urlInfo[0];

            // 过滤掉不需要生成的URL
            isRequester = isRequester || function (path) {
                // 默认跳过以`/download`和`/upload`结尾的路径
                return !/\/(?:up|down)load$/.test(path);
            };

            if (!isRequester(url)) {
                return url;
            }

            const me = this;
            return function (data = {}, configs = {}) {
                if (method === 'get') {
                    return me.get(url, extend(configs, {
                        params: data
                    }));
                }

                return me.post(url, data, configs);
            };
        }

        if (isFunction(url)) {
            // 是一个函数，不用封装
            return url;
        }

        if (isObject(url) || Array.isArray(url)) {
            // 是一个集合，那么递归封装一下
            let collection = clone(url);
            collection.forEach((url, key) => {
                collection[key] = this.genRequesters(url, isRequester);
            });
            return collection;
        }
    }
}
