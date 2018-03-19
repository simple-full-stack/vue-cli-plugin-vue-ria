/**
 * @file 权限验证相关功能
 * @author Justineo(justice360@gmail.com)
 */

import {includes, keys} from 'lodash';

export default class Auth {
    static TYPE = {
        NONE: 'none',
        EDITABLE: 'editable',
        READONLY: 'readonly',
        MIXED: '-'
    };

    /**
     * 已经注册的权限类型转换器
     * @type {Object.<string, Function>}
     * @private
     */
    filters = {
        rtoe(type) {
            return type === Auth.TYPE.READONLY
                ? Auth.TYPE.EDITABLE
                : type;
        },

        rton(type) {
            return type === Auth.TYPE.READONLY
                ? Auth.TYPE.NONE
                : type;
        },

        ntor(type) {
            return type === Auth.TYPE.NONE
                ? Auth.TYPE.READONLY
                : type;
        },

        up(type) {
            return type === Auth.TYPE.NONE
                ? Auth.TYPE.READONLY
                : Auth.TYPE.EDITABLE;
        },

        max(types) {
            let max = Auth.TYPE.NONE;
            types.forEach(type => {
                if (type === Auth.TYPE.EDITABLE) {
                    max = type;
                    return false;
                }
                else if (type === Auth.TYPE.READONLY) {
                    max = type;
                }
            });
            return max;
        },

        min(types) {
            let min = Auth.TYPE.EDITABLE;
            types.some(type => {
                if (type === Auth.TYPE.NONE) {
                    min = type;
                    return true;
                }
                else if (type === Auth.TYPE.READONLY) {
                    min = type;
                }
            });
            return min;
        }
    };

    /**
     * 获取某个权限模块在某个权限集合中的权限类型
     *
     * @param {string} authName 权限模块的名字
     * @param {Object} authMap 权限模块集合
     * @return {Auth.TYPE} 返回权限类型
     */
    get(authName, authMap) {
        let filter;
        if (/^\(.+\)$/.test(authName)) {
            return this.get(authName.substr(1, authName.length - 2), authMap);
        }
        let authNames = [];
        if (/^(\w+):/.test(authName)) {
            let authPattern = /^(?:(\w+):)(.+)$/;
            let arr = authPattern.exec(authName);
            if (!arr) {
                throw 'Auth error: [' + authName + '] is not a valid auth expression.';
            }
            filter = arr[1];
            let paramStr = arr[2].replace(/^[\s,|]+|[\s,|]+$/g, ''); // trim
            let cache = [];
            let bracketCount = 0;
            for (let i = 0; i < paramStr.length; i++) {
                let ch = paramStr.charAt(i);
                if (ch === '(') {
                    if (bracketCount === 0 && cache.length) { // 括号前有非分隔字符，非法
                        throw 'Auth error: [' + authName + '] is not a valid auth expression.';
                    }
                    if (++bracketCount === 1) { // 最外层第一个括号丢弃
                        continue;
                    }
                }
                else if (ch === ')') {
                    // 最外层括号结束，取出整个括号内的内容递归调用
                    if (--bracketCount <= 0) {
                        let brachketContent = cache.join('');
                        authNames.push(this.get(brachketContent, authMap).toUpperCase());
                        cache = [];
                        continue;
                    }
                }
                else if (bracketCount <= 0 // 不在括号内的内容，碰到分隔字符，将cache里的字符作为一个完整的authName
                    && (ch === ','
                        || ch === '|'
                        || /\s/.test(ch)
                    )
                ) {
                    if (cache.length) {
                        authNames.push(cache.join(''));
                        cache = [];
                    }
                    continue;
                }
                cache.push(ch);
            }
            if (cache.length) {
                authNames.push(cache.join(''));
            }
            if (bracketCount > 0) {
                throw 'Auth error: [' + authName + '] brackets doesn\'t match.';
            }
        }
        else {
            authNames = [authName.trim()];
        }

        let types = [];
        authNames.forEach(name => {
            // 如果是权限类型关键字作为直接量，不需要查询模块
            if (includes(keys(Auth.TYPE), name)) {
                types.push(Auth.TYPE[name]);
                return true;
            }

            let nameSpaces = name.split('.');

            do {
                let type = authMap[nameSpaces.join('.')];
                if (type) {
                    types.push(type);
                    return true;
                }
                nameSpaces.pop();
            } while (nameSpaces.length);

            throw 'Auth error: [' + name + '] not found.';
        });

        if (filter) {
            return this.filters[filter].call(
                null, types.length > 1 ? types : types[0]
            );
        }
        return types[0];
    }

    /**
     * 获取某个权限模块在某个权限集合中是否有基本权限
     *
     * @param {string} authName 权限模块的名字
     * @param {Object} authMap 权限模块集合
     * @return {boolean} 是否可见
     */
    permit(authName, authMap) {
        return this.get(authName, authMap) !== Auth.TYPE.NONE;
    }

    /**
     * 注册新的权限类型转换器
     *
     * @param {string} name 转换器名字
     * @param {function(Auth.TYPE)} filter 转换器处理函数
     */
    registerFilter(name, filter) {
        this.filters[name] = filter;
    }
}
