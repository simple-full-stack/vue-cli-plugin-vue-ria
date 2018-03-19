/**
 * @file underscore扩展
 * @author Justineo(justice360@gmail.com)
 */

import {each, isObject, isFunction, mapKeys} from 'lodash';
import moment from 'moment';

/**
 * 清理对象中无用的键值对
 *
 * 默认会去除所有值为`null`、`undefined`以及空字符串`""`的键值对
 *
 * 如果提供了`defaults`参数，则额外去除值与`defaults`的同名属性相同的键值对
 *
 * @param {Object} object 输入的对象
 * @param {Object} [defaults] 用于提供属性默认值的参照对象
 * @param {boolean} [deep=false] 是否深度清理，即遇到属性值为对象继续递归清理
 * @return {Object} 清理后的新对象
 */
export function purify(object, defaults = {}, deep) {
    let purifiedObject = {};
    each(
        object,
        function (value, key) {
            let isDefaultNull = value == null || value === '';
            let isInDefaults = defaults.hasOwnProperty(key) && defaults[key] === value;
            if (!isDefaultNull && !isInDefaults) {
                if (deep && isObject(value)) {
                    purifiedObject[key] = purify(value, defaults[key], deep);
                }
                else {
                    purifiedObject[key] = value;
                }
            }
        }
    );
    return purifiedObject;
}

/**
 * 根据指定的映射关系修改对象的键名
 *
 * 如果键名不在给定的映射关系中，保留原名
 *
 * @param {Object} obj 输入的对象
 * @param {Object.<string, string>|Function} map 键名的映射关系或函数
 * @return {Object} 转换过的新对象
 */
export function mapKey(obj, map) {
    let result = {};
    if (obj == null) {
        return result;
    }
    if (isFunction(map)) {
        return mapKeys(obj, map);
    }
    each(obj, (value, key) => {
        if (map[key]) {
            result[map[key]] = value;
        }
        else {
            result[key] = value;
        }
    });
    return result;
}

/**
 * 判断两个像数字一样的参数是否相等
 *
 * @param {number|string} num1 第一个像数字的参数
 * @param {number|string} num2 第二个像数字的参数
 * @return {boolean}
 */
export function isNumberLikeEqual(num1, num2) {
    return '' + num1 === '' + num2;
}

/**
 * 格式化数字
 *
 * @param {number} number 输入的数字
 * @param {number} [decimals=0] 保留小数位数
 * @param {string} [emptyValue=""] 当输入为空或不是数字时的返回内容，会加前缀
 * @param {string} [prefix=""] 返回的字符串的前缀
 * @return {string}
 */
export function formatNumber(
    number,
    {
        decimals = 0,
        emptyValue = '',
        prefix = ''
    } = {}
) {
    if (number == null || isNaN(number)) {
        return prefix + emptyValue;
    }

    number = parseFloat(number).toFixed(decimals);
    // 分为整数和小数
    const parts = number.split('.');
    let integer = parts[0];
    const decimal = parts[1];
    // 加上千位分隔
    integer = integer.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
    // 再拼起来
    let result = prefix + integer;
    if (decimal) {
        result += '.' + decimal;
    }
    return result;
}

/**
 * 格式化时间
 *
 * @param {string} time 一般是后端传来的时间字符串
 * @param {string} inputFormat time 时间串的格式
 * @param {string} outputFormat 要输出显示的时间串格式
 * @param {string} fallbackText 如果 time 格式非法，此时要显示的字符串
 *
 * @return {string}
 */
export function formatTime(
    time,
    {
        inputFormat = 'YYYYMMDDHHmmss',
        outputFormat = 'YYYY-MM-DD HH:mm:ss',
        fallbackText = '-'
    } = {}
) {
    time = moment(time, inputFormat || 'YYYYMMDDHHmmss');
    return time.isValid()
        ? time.format(outputFormat || 'YYYY-MM-DD HH:mm:ss')
        : fallbackText || '-';
}

/**
 * 一个英文字母算1个，一个中文算 factor 个
 *
 * @param {string} str 需要计算长度的字符串
 * @param {number} factor 中文长度，默认2
 * @return {number} 字符串长度
 */
export function getStringLength(str, factor = 2) {
    return str.replace(/[^\x00-\xff]/g, Array(factor + 1).join('x')).length;
}
