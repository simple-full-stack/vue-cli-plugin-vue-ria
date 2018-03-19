/**
 * @file 封装locStorage的操作
 * @author Chestnut
 */

import moment from 'moment';

export class Session {
    constructor() {
        this.session = {};
    }

    /**
     * 测试会话是否有指定键名的内容
     *
     * @param {string} key 会话数据的键名
     * @return {boolean} 是否包含指定的键名
     */
    has(key) {
        return this.session.hasOwnProperty(key);
    }

    /**
     * this.get
     *
     * @param {string} key 会话数据的键名
     * @return {*} 特定的会话数据
     */
    getItem(key) {
        return this.session[key];
    }

    /**
     * this.set
     *
     * @param {string} key 会话数据的键名
     * @param {*} value 会话数据的值
     */
    setItem(key, value) {
        this.session[key] = value;
    }

    /**
     * this.removeItem
     *
     * @param {string} key 会话数据的键名
     */
    removeItem(key) {
        delete this.session[key];
    }

    /**
     * this.clear
     */
    clear() {
        this.session = {};
    }
}

export default class Storage {
    constructor() {
        this.session = new Session();
    }

    /**
     * 获取对应store
     *
     * @param {string} type 存储类型
     * @return {Object|Storage} 存储器
     */
    getStore(type) {
        let store;
        switch (type) {
            case 'local':
                store = localStorage;
                break;
            case 'session':
                store = sessionStorage;
                break;
            case 'context':
            default:
                store = this.session;
                break;
        }
        return store;
    }

    /**
     * storage.set
     *
     * @param {string} key 存入的key
     * @param {string} value 存入的value
     * @param {Object} options 可选配置
     * @param {string} [options.type=context] 默认context，可选local，session
     * @param {Moment|Date|string} [options.expire] 到期时间，默认无限
     */
    set(key, value, options = {}) {
        let store = this.getStore(options.type);
        let expire = options.expire;

        store.setItem(
            key,
            value
                + (expire
                    ? '|' + moment(expire).valueOf()
                    : ''
                )
        );
    }

    /**
     * storage.get
     *
     * @param {string} key 存入的key
     * @param {Object} [options] 设置
     * @param {string} [options.type=context] 默认context，可选local，session
     * @param {boolean} [options.isPop=false] 获取成功是否移除
     * @param {boolean} [options.isIgnoreExpire=false] 是否忽略过期时间
     * @return {string|null} 存在且未过期或忽略过期返回字符串，否则返回null
     */
    get(key, options = {}) {
        let store = this.getStore(options.type);

        let valueWithExpire = store.getItem(key);
        if (valueWithExpire == null) {
            // 没这个值只能直接返回，处理都做不了，不好写一起
            return null;
        }

        options = options || {};
        valueWithExpire = valueWithExpire.split(/\|([^|]+)$/);
        let value = valueWithExpire[0];
        let expire = valueWithExpire[1] && parseInt(valueWithExpire[1], 10);
        let isExpired = moment(expire).isValid() && moment().diff(moment(expire)) > 0;

        // 有值而且没过期或者不管或者没设置
        if (options.isIgnoreExpire || !expire || !isExpired) {
            options.isPop && store.removeItem(key);
            return value;
        }
        // 过期了
        store.removeItem(key);
        return null;
    }

    /**
     * storage.remove 清除指定key的键值对
     *
     * @param {string} key 存入的key
     * @param {Object} options 可选配置
     * @param {string} [options.type=context] 默认context，可选local，session
     */
    remove(key, options = {}) {
        let store = this.getStore(options.type);
        store.removeItem(key);
    }

    /**
     * storage.key 获取nth个key的名字
     * 仅限local和session使用
     *
     * @param {number} nth 第几个
     * @param {Object} options 可选配置
     * @param {string} options.type 可选local，session
     * @return {string|null} nth值的key或null
     */
    key(nth, options = {}) {
        if (options.type === 'local') {
            return localStorage.key(nth);
        }
        else if (options.type === 'session') {
            return sessionStorage.key(nth);
        }
        return null;
    }

    /**
     * storage.clear 清除指定存储器
     *
     * @param {Object} options 可选配置
     * @param {string} [options.type=context] 默认context，可选local，session
     */
    clear(options = {}) {
        let store = this.this.getStore(options.type);
        store.clear();
    }
}
