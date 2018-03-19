/**
 * @file region 工具函数
 * @author zhangli25(zhangli25@baidu.com)
 */
import {includes, find} from 'lodash';
import {isNumberLikeEqual} from './lang';

function walk(regionData, callback, childrenKey) {
    return find(regionData, item => callback(item) || walk(item[childrenKey], callback, childrenKey));
}

function parseIdsParameter(ids, fieldName) {
    if (typeof ids === 'string') {
        ids = ids.split(',');
    }

    if (!isArray(ids)) {
        throw new TypeError(`The ${fieldName} parameter should be Array or a string splited by comma.`);
    }

    return ids;
}

export function getLabelsById(
    regionData,
    idList,
    {
        idKey = 'id',
        labelKey = 'label',
        childrenKey = 'children'
    } = {}
) {
    if (idList.length === 1 && idList[0] === '0') {
        return ['不限'];
    }

    let labels = [];
    walk(regionData, ({[idKey]: id, [labelKey]: label}) => {
        if (includes(idList, id)) {
            labels.push(label);
            return labels.length === idList.length;
        }
    }, childrenKey);
    return labels;
}

export function getShortText(
    regionData,
    idList,
    {
        displayCount = 1,
        separator = '、',
        idKey = 'id',
        labelKey = 'label',
        childrenKey = 'children'
    } = {}
) {
    if (idList.length === 1 && idList[0] === '0') {
        return '不限';
    }

    let labels = getLabelsById(regionData, idList, {idKey, labelKey, childrenKey});
    if (labels.length === 0) {
        return '-';
    }

    if (displayCount < 1) {
        displayCount = 1;
    }

    if (labels.length === displayCount) {
        return labels.slice(0, displayCount).join(separator);
    }

    return `${labels.slice(0, displayCount).join(separator)}等${labels.length}个`;
}

export function getLeafIds(
    regionData,
    ids,
    {
        idKey = 'id',
        labelKey = 'label',
        childrenKey = 'children'
    } = {}
) {
    let result = ids;
    let walk = (areas = regionData) => {
        areas.forEach(area => {
            if (area[childrenKey] && area[childrenKey].length) {
                result = result.filter(id => !isNumberLikeEqual(id, area[idKey]));
                walk(area[childrenKey]);
            }
        });
    };
    walk();
    return result;
}

// 如果每个节点下面的 id 被全选了，那就保留该节点 id 就行了。
export function getFewestIds(regionData, selectedIds) {
    selectedIds = parseIdsParameter(selectedIds, 'selectedIds');

    function checkIsChildrenAllSelected(item, selectedIds) {
        let isAllSelected = true;
        find(item.children, child => {
            if (!child.children || !child.children.length) {
                isAllSelected = includes(selectedIds, child.id);
            }
            else {
                isAllSelected = includes(selectedIds, child.id) || checkIsChildrenAllSelected(child, selectedIds);
            }
            return !isAllSelected;
        });
        return isAllSelected;
    }

    const normalizedIds = [];
    const delayTasks = [];
    walk(regionData, (item) => {
        if (!item.children || !item.children.length) {
            includes(selectedIds, item.id) && normalizedIds.push(item.id);
        }
        else {
            const isAllSelected = checkIsChildrenAllSelected(item, selectedIds);
            if (isAllSelected) {
                normalizedIds.push(item.id);

                // 确保不再往深了递归
                const stashedChildren = item.children;
                item.children = [];
                delayTasks.push(() => {
                    item.children = stashedChildren;
                });
            }
        }
    });
    delayTasks.forEach(task => task());

    return normalizedIds;
}

// 将所有涉及的到的节点 id 都找出来
export function getAllIds(regionData, selectedIds) {
    selectedIds = parseIdsParameter(selectedIds, 'selectedIds');

    const normalizedIds = [];
    const delayTasks = [];
    walk(regionData, item => {
        if (includes(selectedIds, item.id)) {
            normalizedIds.push(item.id);

            walk(item.children, item => {
                normalizedIds.push(item.id);
            });

            const stashedChildren = item.children;
            item.children = [];
            delayTasks.push(() => {
                item.children = stashedChildren;
            });
        }
    });
    delayTasks.forEach(task => task());

    return normalizedIds;
}
