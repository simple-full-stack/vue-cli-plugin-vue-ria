/**
 * @file createView
 * @author zhangli25(zhangli25@baidu.com)
 */
import {clone, uniqueId, some, isArray, isFunction, assign, isObject} from 'lodash';
import {formatTime, formatNumber} from '../utils/lang';
import uri from '../utils/uri';
import toastManager from 'veui/managers/toast';
import alertManager from 'veui/managers/alert';
import confirmManager from 'veui/managers/confirm';
import promptManager from 'veui/managers/prompt';

const pageFilters = {
    time: formatTime,
    number: formatNumber
};

const pageMixin = {
    created() {
        // store 初始化
        if (this.store && !this.store.__inited) {
            this.store.init();
            this.store.__inited = true;
        }
    },
    methods: {

        /**
         * 显示 toast
         *
         * @param {string} content toast上展示出来的文本
         * @param {string} type toast类型，可以是 success、warn、info、error
         */
        showToast(content, {type = 'info'} = {}) {
            toastManager[type](content);
        },

        /**
         * 显示 alert 框
         *
         * @param {string} content 提示内容
         * @param {string} title 标题
         * @param {string} type alert类型，可以是 success、info、error、warn
         * @param {Function} ok ok 回调
         * @return {Promise}
         */
        waitAlert(content, title, {type = 'info', ok} = {}) {
            return alertManager[type](content, title, {ok});
        },

        /**
         * 询问框
         *
         * @param {string} content 询问内容
         * @param {string} title 询问标题
         * @param {string} type alert类型，可以是 success、info、error、warn
         * @param {Function} ok ok 回调
         * @param {Function} cancel cancel 回调
         * @return {Promise}
         */
        waitConfirm(content, title, {type = 'info', ok, cancel} = {}) {
            return confirmManager[type](content, title, {ok, cancel});
        },

        /**
         * prompt 框
         *
         * @param {string} content 内容
         * @param {string} title 标题
         * @param {string} type alert类型，可以是 success、info、error、warn
         * @param {Function} ok ok 回调
         * @param {Function} cancel cancel 回调
         * @return {Promise} resolve回调第一个参数是用户填写的内容
         */
        waitPrompt(content, title, {type = 'info', ok, cancel} = {}) {
            return promptManager[type](content, title, {ok, cancel});
        },

        /**
         * 下载 url 所标识的资源
         *
         * @param {string} url url
         * @param {string} [method=post] 下载请求方法
         */
        download(url, method = 'post') {
            if (method === 'get') {
                return window.open(url);
            }

            let div = document.createElement('div');
            document.body.appendChild(div);

            let query = this.global.user.getAderArgMap();
            let realUrl = uri.withQuery(url, query);
            let iframeId = uniqueId('iframe-download-');
            let formId = uniqueId('form-download-');
            div.innerHTML = `
                <div class="download" style="display:none">
                    <form
                        action="${realUrl}"
                        method="${method}"
                        target="${iframeId}"
                        id="${formId}"
                    ></form>
                    <iframe
                        src="about:blank"
                        id="${iframeId}"
                        name="${iframeId}"
                    ></iframe>
                </div>
            `;

            let iframe = document.getElementById(iframeId);
            iframe.onload = () => {
                document.body.removeChild(div);
            };

            let form = document.getElementById(formId);
            form.submit();
        },

        isAllow(name) {
            return this.global.isAllow(name);
        }
    }
};

function normalizeInject(inject = {}) {
    const realInject = {};
    if (isArray(inject)) {
        inject.reduce((prev, cur) => {
            prev[cur] = cur;
            return prev;
        }, realInject);
    }
    else {
        assign(realInject, inject);
    }

    // vue 2.5 才支持 from 和 default 配置，留着等升级到 vue 2.5
    // if (isArray(inject)) {
    //     inject.reduce((prev, cur) => {
    //         prev[cur] = {from: cur};
    //         return prev;
    //     }, realInject);
    // }
    // else {
    //     reduce(inject, (result, value, key) => {
    //         result[key] = isString(value) ? {from: value} : value;
    //         return result;
    //     }, realInject);
    // }
    return realInject;
}

function normalizeProps(props) {
    if (!props) {
        return {};
    }

    if (isArray(props)) {
        return props.reduce((prev, cur) => {
            prev[cur] = {};
            return prev;
        }, {});
    }

    return {...props};
}

export function isPage(ComponentOptions) {
    ComponentOptions = ComponentOptions.$options || ComponentOptions;
    const uiTypes = ComponentOptions.uiTypes || [];
    return uiTypes.some(item => item === 'page');
}

/**
 * 用于做 view 继承
 *
 * @param {Component} Parent 父 view
 * @param {BaseModel} Model Model 类
 * @param {Component} options 子 View
 * @return {Component}
 */
export default function createView(Parent, Model, options = {}) {
    const storeProp = {
        validator(val) {
            return val instanceof Model;
        },
        default() {
            let store;
            if (this.store) {
                store = this.store;
            }
            else {
                store = new Model(this.global);
            }
            return store;
        }
    };

    const uiTypes = ['page'];

    const filters = {
        ...pageFilters,
        ...(options.filters || {})
    };

    const mixins = [pageMixin, ...(options.mixins || [])];

    // 没有父类，说明是最顶层的
    if (!Parent) {
        const props = {
            ...normalizeProps(options.props),
            store: storeProp
        };

        return {
            ...(options || {}),
            props,
            uiTypes,
            filters,
            mixins,
            inject: {
                ...normalizeInject(options.inject),
                // 要注入 globalModel，这个 globalModel 在 index.js 里面初始化全局 Vue 实例的时候 provide 。
                global: 'global'
            }
        };
    }

    if (!isPage(Parent)) {
        throw new Error('Parent Component is not a page Component!');
    }

    // clone 一下，不要影响原始 Parent options
    const RealParent = clone(Parent);
    RealParent.props = {...(RealParent.props || {}), store: storeProp};

    // 如果 options.components 里面配置了 Parent ，就用配置的这个 name ，否则用 Parent.name 注册 RealParent
    const components = options.components || {};
    const hasParentConfig = some(components, (component, name) => {
        if (component === Parent) {
            components[name] = RealParent;
            return true;
        }
    });
    if (!hasParentConfig) {
        components[RealParent.name] = RealParent;
    }

    // 生成一个 store key ，略微保证一下 provide store key 不会冲突
    const storeKey = uniqueId('store-key-');
    RealParent.inject = {
        ...normalizeInject(RealParent.inject),
        store: storeKey
    };

    return {
        ...(options || {}),
        props: {
            ...normalizeProps(options.props),
            store: storeProp
        },
        components,
        provide() {
            const originProvide = options.provide;
            const realProvideObj = {};
            if (isFunction(originProvide)) {
                assign(realProvideObj, originProvide.call(this));
            }
            else if (isObject(originProvide)) {
                assign(realProvideObj, originProvide);
            }
            return {...realProvideObj, [storeKey]: this.store};
        },
        uiTypes,
        filters,
        mixins,
        inject: {
            ...normalizeInject(options.inject),
            // 要注入 globalModel，这个 globalModel 在 index.js 里面初始化全局 Vue 实例的时候 provide 。
            global: 'global'
        }
    };
}
