/**
 * @file ListModel
 * @author zhangli25(zhangli25@baidu.com)
 */

import BaseModel from './BaseModel';
import {
    assign,
    omit,
    omitBy,
    cloneDeep,
    each,
    isNumber,
    isString,
    isEqual,
    defaults,
    mapValues,
    isBoolean,
    isUndefined
} from 'lodash';
import qs from 'qs';
import {purify} from '../utils/lang';
import {getTimeRange} from '../utils/helper';
import uri from '../utils/uri';
import moment from 'moment';

export default class ListModel extends BaseModel {

    /**
     * 页面的标题
     *
     * @type {string}
     */
    title = '列表';

    pageSizes = [30, 50, 100];
    totalCount = 0;
    pageTo = ':page';
    extra = {};

    /**
     * 列表数据请求器
     *
     * @type {Function}
     */
    listRequester = null;

    tableData = [];
    tableUI = 'slim alt';
    tableColumns = null;
    tableKeys = 'id';
    tableSelectable = false;
    tableSelected = [];

    defaultArgs = null;

    sendEmptyParam = false;

    // 是否在做初始化列表数据加载
    initLoading = true;

    /**
     * 列表过滤项表单数据
     * 1. 需要在子类中扩展声明具体属性，才能用v-model去绑定过滤项
     * 2. 由于是v-model的数据，可能存在结构化数据。结构化数据不会出现在url上，所以prepareQuery要去掉这些值
     *
     * @type {Object}
     */
    filter = {
        pageNo: 1,
        pageSize: 30,
        order: 'desc',
        orderBy: 'id',
        timeRange: [
            moment().subtract(7, 'days').startOf('date').toDate(),
            moment().subtract(1, 'days').endOf('date').toDate()
        ]
    };

    /**
     * 时间格式
     *
     * @type {String}
     */
    timeFormat = 'YYYYMMDDHHmmss';

    /**
     * query里起始时间的键名
     *
     * @type {String}
     */
    beginKey = 'startTime';

    /**
     * query里终止时间的键名
     *
     * @type {String}
     */
    endKey = 'endTime';

    /**
     * @override
     *
     * 确定值的意思比如 pageSize、pageNo 在 Model 中是确定的 key，并且都是基本数据类型
     *
     * init
     *   ├─ global.redirect
     *   ├─ requestList
     *   ├─ fillFilterFromQuery
     *   ├─ $watch('$route.query')
     *   ●
     *
     *
     *    nav跳转
     *       ├───────────── global.redirect ───────────────┐
     *       │                                             │
     *       │<─────────── route.query.watcher ────────────┘
     *       │
     *       └──────────────────────┐
     *       ┌──────────────────────┴──────────────────────┐
     *  requestList                                fillFilterFromQuery
     *       └───────────────────── ● ─────────────────────┘
     *
     *
     * pager/tableSort/其他table交互操作 (无不确定值的 v-model 修改 route.query 类型)
     *       │
     *  getQueryUrl
     *       │
     *       ├───────────── global.redirect ───────────────┐
     *       │                                             │
     *       │<─────────── route.query.watcher ────────────┘
     *       │
     *       └──────────────────────┐
     *       ┌──────────────────────┴──────────────────────┐
     *  requestList                                fillFilterFromQuery
     *       └───────────────────── ● ─────────────────────┘
     *
     *
     *  filter (含 v-model 数据修改 route.query 类型)
     *         │
     *    submitSearch
     *         │
     *    prepareQuery
     *         │
     *     getQueryUrl
     *         │
     *         ├───────────── global.redirect ───────────────┐
     *         │                                             │
     *         │<─────────── route.query.watcher ────────────┘
     *         │
     *         └──────────────────────┐
     *         ┌──────────────────────┴──────────────────────┐
     *    requestList                                fillFilterFromQuery （这一步目前看起来重复了，数据本身就从filter来的）
     *         └───────────────────── ● ─────────────────────┘
     *
     *
     * requestList
     *     ├─ getQuery
     *     ├─ prepareParams
     *     ├─ listRequester
     *     ├─ adaptData
     *     ●
     */
    init() {
        super.init();
        // 保存一份默认值
        this.defaultArgs = cloneDeep(this.filter);
    }

    /**
     * 初始化列表数据。
     * 有些页面可能想在初始化请求的时候做点手脚，此处提供一个做手脚的机会。
     */
    initListData() {
        this.requestList();
    }

    /**
     * 在初始化以及 query 发生变化的时候，都要将 query 中的数据同步到 filter 里面去
     *
     * @public
     */
    fillFilterFromQuery() {
        const query = this.getRouteQuery({});

        if (query[this.beginKey] || query[this.endKey]) {
            assign(this.filter, {
                timeRange: getTimeRange(query[this.beginKey],
                    query[this.endKey],
                    {inputFormat: this.timeFormat})
            });
        }

        each(this.filter, (val, key) => {
            if (key !== 'timeRange') {
                this.convertQuery(val, key);
            }
        });
    }

    /**
     * 因为filter里边 undefined 会导致 v-model 无效，所以这里只需要判断3种
     * 这里只能简单转下 number 和 boolean，若有其他结构化数据，应该在子类中覆盖这个方法
     *
     * @protected
     * @param {Mixed}   value        filter里边的数据，这里用不到，占个位
     * @param {string}  key          filter的key
     */
    convertQuery(value, key) {
        const query = this.getRouteQuery({});
        const defaultArgs = this.defaultArgs;

        // 如果 key 在 query 中存在但是没有值，代表值为空，没有 key 代表使用默认
        let val = key in query ? query[key] || null : defaultArgs[key];
        // 非简单类型无法自动处理，肯定会在prepareQuery的时候去分解成string放在url里边，这里不用管了
        if (!isString(defaultArgs[key]) && !isNumber(defaultArgs[key]) && !isBoolean(defaultArgs[key])
            && defaultArgs[key] !== null) {
            this.filter[key] = val;
            return;
        }
        // 值是字符串才可能要转类型
        if (isString(val)) {
            if (isNumber(defaultArgs[key])) {
                val = parseFloat(val);
            }
            else if (isBoolean(defaultArgs[key])) {
                val = val === 'true';
            }
            else if (defaultArgs[key] === null && /^(?:[1-9][0-9]*\.?[0-9]*|0\.[0-9]*|0)$/.test(val)) {
                // 检查字符串是不是合法数字类型
                let fixedVal = parseFloat(val);
                if (!isNaN(fixedVal)) {
                    val = fixedVal;
                }
            }
        }
        this.filter[key] = !isUndefined(val) && val !== '' ? val : null;
    }

    /**
     * 根据 url 参数生成 pageTo
     *
     * @public
     */
    generatePageTo() {
        const params = qs.stringify(
            omit(this.getFilteredQuery(), 'pageNo')
        );
        this.pageTo = `#${this.getRoutePath()}?pageNo=:page${params ? ('&' + params) : ''}`;
    }

    /**
     * 主要为了格式化 filter 中的结构化数据到字符串，放到url中
     * 子类可以覆盖这个方法。
     *
     * @param {Object} [query] 默认为filter属性
     * @protected
     * @return {Object}
     */
    prepareQuery(query = this.filter) {
        if (query.timeRange) {
            assign(query, getTimeRange(query.timeRange[0], query.timeRange[1], {
                inputFormat: this.timeFormat,
                outputFormat: this.timeFormat,
                beginKey: this.beginKey,
                endKey: this.endKey
            }));
        }

        return omit(query, 'timeRange');
    }

    /**
     * filter form submit 的时候，会调用该方法
     *
     * @protected
     */
    submitSearch() {
        const query = this.getRouteQuery({});
        let filterParams = this.prepareQuery();
        if (this.isQueryAndFilterEqual(query, filterParams)) {
            this.requestList();
            return;
        }

        // 任何过滤器产生的请求，页码都应该置为1
        // 处理过的query里头没有pageNo代表这个列表不分页，就别处理
        if (filterParams.pageNo) {
            filterParams.pageNo = 1;
        }

        this.global.redirect({
            url: this.getQueryUrl(filterParams),
            type: 'push'
        });
    }

    isQueryAndFilterEqual(query, filterParams) {
        return isEqual(
            mapValues(
                defaults(query, this.prepareQuery(this.defaultArgs)),
                convertCompareValue
            ),
            mapValues(
                filterParams,
                convertCompareValue
            )
        );
    }

    /**
     * Table select 事件的回调方法
     *
     * @protected
     * @param {Object} selected 当前选中项
     * @param {Array.<Object>} selectedItems 所有选中项
     */
    tableSelect(selected, selectedItems) {}

    /**
     * Table sort 事件的回调方法
     *
     * @protected
     * @param {string} orderBy 排序字段
     * @param {string} order 排序方式：asc desc
     */
    tableSort(orderBy, order) {
        // 同步一遍自身数据
        this.filter.order = order;
        this.filter.orderBy = orderBy;

        // 同步一遍query
        this.global.redirect({
            url: this.getQueryUrl({
                order,
                orderBy
            }),
            type: 'push'
        });
    }

    /**
     * pageSize 发生变化的时候调用
     *
     * @protected
     * @param {number} pageSize page size
     */
    pageSizeChange(pageSize) {
        // 同步一遍自身数据
        this.filter.pageSize = pageSize;
        this.filter.pageNo = 1;

        // 同步一遍query
        this.global.redirect({
            url: this.getQueryUrl({
                pageSize,
                pageNo: 1
            }),
            type: 'push'
        });
    }

    /**
     * 页码发生变化之后调用
     *
     * @protected
     * @param {number} pageNo 页码
     */
    pageNoChange(pageNo) {
        this.filter.pageNo = pageNo;
    }

    /**
     * 获取查询参数
     * 1. pager生成页面项url使用
     * 2. 真正发送请求时使用
     *
     * @param {Object} [params] 额外参数
     * @protected
     * @return {Object}
     */
    getQuery(params) {
        return convertNullToEmptyString(
            defaults({}, params, this.getRouteQuery({}), this.prepareQuery(this.defaultArgs))
        );
    }

    /**
     * 提前处理后端返回的数据
     *
     * @protected
     * @param {Object} data 后端返回的数据
     * @return {Object}
     */
    adaptData(data) {
        return data;
    }

    /**
     * 准备提交到后端的参数
     * 这个方法主要是提供能力去过滤一些前端数据用但是后端不用的参数
     *
     * @param  {Object} params 提交到后端的参数
     * @return {Object}
     */
    prepareParams(params) {
        return params;
    }

    /**
     * 发出列表请求
     *
     * @public
     * @param {Object} params 请求参数
     * @param {Object} config 配置参数
     * @return Promise
     */
    async requestList(params, config) {
        params = this.prepareParams(this.getQuery(params));
        try {
            const data = await this.listRequester(
                // 这里 omit 的主要对象是传入的 params，route上边的已经处理过了
                this.sendEmptyParam ? omitBy(params, val => val == null) : purify(params),
                config
            );
            ({
                pageNo: this.filter.pageNo,
                pageSize: this.filter.pageSize,
                totalCount: this.totalCount,
                result: this.tableData,
                order: this.filter.order,
                orderBy: this.filter.orderBy,
                extra: this.extra
            } = this.adaptData(data));
        }
        catch (e) {
            this.totalCount = 0;
            this.filter.pageNo = 1;
            this.filter.pageSize = 30;
            this.extra = {};
            this.tableData = [];
            throw e;
        }
    }

    /**
     * 获取在地址栏中使用的过滤掉默认参数的对象
     *
     * @param  {Object} params 额外参数
     * @return {Object}
     */
    getFilteredQuery(params) {
        let flag = convertNullToEmptyString(this.prepareQuery(this.defaultArgs));
        return omitBy(
            this.getQuery(params),
            (val, key) => key in flag && isEqual(flag[key], val)
        );
    }

    /**
     * 构造用于触发查询操作的地址栏url
     *
     * @public
     * @param {Object} params 要append进去的参数
     * @return {string}
     */
    getQueryUrl(params) {
        return uri.withQuery(
            this.getRoutePath(),
            // 去掉和默认参数一样的值，然后把 undefiend/null 转成 '' 放到 url 上
            this.getFilteredQuery(params)
        );
    }
}

function convertNullToEmptyString(obj) {
    return mapValues(
        obj,
        val => (val == null ? '' : val)
    );
}

function convertCompareValue(val) {
    if (val && !isString(val)) {
        return val.toString();
    }
    else if (val == null) {
        return '';
    }
    return val;
}
