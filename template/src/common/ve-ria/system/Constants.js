/**
 * @file 常量保存与转换
 * @author Justineo(justice360@gmail.com) Chestnut
 */

import {contains, pluck, each, extend} from 'lodash';
import {mapKey} from '../utils/lang';

const VL_MAP_SUFFIX = '_MAP';
const VL_DATASOURCE_SUFFIX = '_DATASOURCE';

export default class Contants {
    map = {};

    handleVL(value, key) {
        // 数组且只要数组元素都包含v、l两个key，就进行转换
        if (
            Array.isArray(value)
            && !contains(pluck(value, 'v'), undefined)
            && !contains(pluck(value, 'l'), undefined)
        ) {
            let vlMap = this.map[key + VL_MAP_SUFFIX] = {};
            let vlDatasource = this.map[key + VL_DATASOURCE_SUFFIX] = [];

            value.forEach(item => {
                vlMap[item.v] = item.l;
                vlDatasource.push(mapKey(item, (v, k) => (k === 'v' ? 'value' : 'label')));
            });
        }
    }

    get(key) {
        return this.map[key];
    }

    set(key, value) {
        this.map[key] = value;
        this.handleVL(value, key);
    }

    remove(key) {
        delete this.map[key];
    }

    getMap(key) {
        return this.map[key + VL_MAP_SUFFIX];
    }

    getDatasource(key) {
        return this.map[key + VL_DATASOURCE_SUFFIX];
    }

    init(constants) {
        // 先copy所有内容
        extend(this.map, constants);

        // 处理`VL`类型常量
        // 例如 [ { v: 'ACTIVE', l: '已启用' }, { v: 'INACTIVE', l: '未启用' } ]
        // 将生成如下几种形式的数据：
        // 1. 以v为key、以l为value的对象，命名为`[原始常量名]_MAP`
        //    如 { ACTIVE: '已启用', INACTIVE: '未启用' }
        // 2. 将v/l分别转换为value/label的数组，命名为`[原始常量名]_DATASOURCE`
        //    如 [ { value: 'ACTIVE', label: '已启用' }, { value: 'INACTIVE', label: '未启用' } ]
        each(this.map, (...args) => this.handleVL(...args));
    }
}
