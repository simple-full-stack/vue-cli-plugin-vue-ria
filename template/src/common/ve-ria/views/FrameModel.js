/**
 * @file FrameModel
 * @author zhangli25(zhangli25@baidu.com)
 */

import BaseModel from './BaseModel';

export default class FrameModel extends BaseModel {

    /**
     * 是否展开侧边导航
     *
     * @type {'expand'|'collapse'|'collapse-expand'}
     */
    frameState = 'expand';

    /**
     * 导航标题
     *
     * @type {string}
     */
    frameTitle = '标题';

    /**
     * “所有”选项的文本
     *
     * @type {string}
     */
    frameItemAll = '所有推广计划';

    /**
     * 导航树的数据源
     *
     * @type {Array}
     */
    frameDatasource = [];

    /**
     * 当前选中项的 value ，如果是 null ，则是选中“所有”项
     *
     * @type {number|string}
     */
    frameCurrent = null;
}
