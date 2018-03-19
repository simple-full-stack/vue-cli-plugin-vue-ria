/**
 * @file globalModel
 * @author zhangli25(zhangli25@baidu.com)
 */

import {each, isFunction, assign, startsWith} from 'lodash';
import User from '../system/User';
import Constants from '../system/Constants';
import Nmp from '../io/Nmp';

export default class GlobalModel {

    user = new User();

    constants = new Constants();

    nmp = new Nmp();

    /**
     * 驱动页面跳转
     *
     * @type {Object}
     */
    redirectUrl = {

        /**
         * 跳转类型，取值可以是：push、replace、back、reload
         *
         * @type {string}
         */
        type: undefined,

        /**
         * 要跳转到的地址，如果 type 为 back 或者 reload，这个值无效
         *
         * @type {string}
         */
        url: undefined
    };

    /**
     * session 信息
     *
     * @type {Object}
     */
    session = null;

    /**
     * sidebar有三种状态：collapsed、visible、hidden
     * collapsed：有菜单项，但是sidebar被收起来了
     * visible：有菜单项，并且sidebar被展开了
     * hidden：没有菜单项，sidebar隐藏掉了
     *
     * @type {string}
     */
    sidebarState = 'hidden';

    /**
     * 当前会造成 loading “加载中”效果的请求数
     *
     * @type {Number}
     */
    loadingCounter = 0;

    /**
     * 当前数据接口请求数
     *
     * @type {Number}
     */
    requestCounter = 0;

    /**
     * 路由
     *
     * @type {Router}
     */
    router = null;

    /**
     * 当前页面来自于哪个地址。
     *
     * INIT_NULL 初始空值
     * BACK_NULL 调用 back 函数之后，清空的
     *
     * @type {'INIT_NULL'|'BACK_NULL'|URL|object}
     */
    fromu = 'INIT_NULL';

    /**
     * @override
     */
    init(config, csts, router) {
        this.router = router;
        // 每次页面跳转都记录一下之前的地址。
        this.router.afterEach((to, fromu) => {
            this.fromu = this.fromu === 'BACK_URL' ? 'INIT_NULL' : fromu;
        });

        this.config = config;
        this.constants.init(csts);
        this.user.mergeOptions(config.user);

        // session 和 constants 是两个特殊的接口，如果没配置这两个接口的话，就 mock 一下。
        assign(this.config.api, {
            session: this.config.api.session || (() => ({visitor: {auth: {}}})),
            constants: this.config.api.constants || (() => {})
        });

        each(this.config.api, (url, key) => {
            this.config.api[key] = this.genRequesters(url);
        });
    }

    /**
     * session 接口请求完毕之后，调用一下这个方法，初始化全局的 session 信息
     *
     * @public
     * @param {Object} session session 信息
     */
    initUser(session) {
        this.user.init(session);
    }

    activeNmpHook(options) {
        this.nmp.activeHook(this.user, options);
    }

    /**
     * 获取权限
     *
     * @public
     * @param {string} authId 权限字段
     * @return {Object}
     */
    getUserAuth(authId) {
        return this.user.getAuth(authId);
    }

    /**
     * 判断指定权限是否不是 none
     *
     * @public
     * @param {string} authId 权限字段
     * @return {boolean}
     */
    isAllow(authId) {
        const auth = this.getUserAuth(authId);
        return auth.isVisible;
    }

    /**
     * 根据URL字符串生成请求发送器
     *
     * 传入一个字符串时，只返回一个发送器函数；传入数组或对象时，递归；传入函数时
     *
     * url在配置中的格式是 "[method]|[path]"
     *
     * @protected
     * @param {string|Array.<string>|Object.<string, string>|Function} url 请求路径或多个请求路径的集合，或是取值函数
     * @param {function(string):boolean} isRequester 判断是否是需要生成请求发送器的路径
     * @return {Function|Array.<Function>|Object.<string, Function>} 将对应的路径转换为发送器后返回
     */
    genRequesters(url, isRequester) {
        let requester = this.nmp.genRequesters(url, isRequester);
        if (isFunction(requester)) {
            let isGetMethod = startsWith(url, 'get|');
            let delayTimer;
            return async (data, config = {}) => {
                this.requestCounter++;

                let showLoading = config.showLoading;
                if (showLoading !== false) {
                    // 对于 get 请求，如果请求时间很短（300ms 内），
                    // 就不要显示 loading 了。
                    if (isGetMethod) {
                        clearTimeout(delayTimer);
                        delayTimer = null;

                        delayTimer = setTimeout(() => this.loadingCounter++, 300);
                    }
                    // 对于 post （和其他）请求，不要延迟显示 loading 了，
                    // 不然会造成诸如“快速点击两次提交按钮”的问题。
                    else {
                        this.loadingCounter++;
                    }
                }

                let result;
                try {
                    result = await requester(data, config);
                }
                catch (e) {
                    throw e;
                }
                finally {
                    if (showLoading !== false) {
                        clearTimeout(delayTimer);
                        delayTimer = null;

                        // 有可能 get 方法请求比较快，还没来得及让 this.loadingCounter 加1，就进入到这里了，
                        // 这种情况下如果直接 this.loadingCounter-- ，就会造成 this.loadingCounter 出现负数。
                        if (this.loadingCounter > 0) {
                            this.loadingCounter--;
                        }
                    }

                    this.requestCounter--;
                }
                return result;
            };
        }
        return requester;
    }

    /**
     * 设置 sidebar 状态
     *
     * @public
     * @param {string} state 状态
     */
    setSidebarState(state) {
        this.sidebarState = state;
    }

    /**
     * 请求 session 信息
     *
     * @public
     * @return Promise<Object>
     */
    async requestSession() {
        this.session = await this.config.api.session();
    }

    /**
     * 请求常量信息
     *
     * @public
     * @return Promise<Object>
     */
    async requestConstants() {
        each(await this.config.api.constants(), (cst, key) => this.constants.set(key, cst));
    }

    /**
     * 页面跳转
     *
     * @public
     * @param {string} url 地址
     * @param {string} type 类型
     */
    redirect({url, type}) {
        this.redirectUrl = assign({}, this.redirectUrl, {url, type});
    }
}
