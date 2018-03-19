/**
 * @file helper
 * @author Justineo, Chestnut
 */
import {isString, defaults} from 'lodash';
import {mapKey} from './lang';
import moment from 'moment';

/**
 * 生成时间段数据
 *
 * 未指定`begin`及`end`时默认取最近7天
 *
 * 有两种重载：
 * 1. getTimeRange(options)
 * 2. getTimeRange(begin, end, options)
 *
 * @param {Date|string} [begin] 开始日期
 * @param {Date|string} [end] 结束日期
 * @param {Object} [options] 生成选项
 * @param {string} [options.inputFormat] 输入参数的格式，为`'Date'`时会当作`Date`对象，否则为格式字符串
 * @param {string} [options.outputFormat] 输出参数的格式，参见`inputFormat`
 * @param {string} [options.beginKey] 结果对象开始时间的键名
 * @param {string} [options.endKey] 结果对象结束时间的键名
 * @return {Object|Array} 时间段的数据，格式由`options`参数决定
 */
export function getTimeRange(begin, end, options) {

    // 只有一个参数时，认为是options
    if (arguments.length === 1) {
        options = begin;
    }

    let defaultOption = {
        inputFormat: 'YYYYMMDDHHmmss',
        outputFormat: 'Date'
    };

    options = defaults({}, options, defaultOption);

    // 解析输入，没有则使用默认时间
    if (begin && end) {
        begin = isString(begin)
            ? moment(begin, options.inputFormat)
            : moment(begin);
        end = isString(end)
            ? moment(end, options.inputFormat)
            : moment(end);
    }
    else {
        let now = moment().startOf('day');

        // 默认前七天
        begin = now.clone().subtract(7, 'days');
        end = now.clone().subtract(1, 'day').endOf('day');
    }

    // 处理输出
    if (options.outputFormat.toLowerCase() === 'date') {
        // 直接输出数组用于DatePicker绑定
        return [begin.toDate(), end.toDate()];
    }

    begin = begin.format(options.outputFormat);
    end = end.format(options.outputFormat);

    const keys = {
        begin: options.beginKey || 'begin',
        end: options.endKey || 'end'
    };

    return mapKey(
        {
            begin,
            end
        },
        {
            begin: keys.begin,
            end: keys.end
        }
    );
}
