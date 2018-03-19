/**
 * @file AppModel
 * @author zhangli25(zhangli25@baidu.com)
 */

import {
    isString,
    some,
    isFunction,
    each,
    clone,
    map,
    uniqueId,
    find,
    cloneDeep
} from 'lodash';
import BaseModel from './BaseModel';

function normalizeHash(url) {
    return url.replace('#', '');
}

/**
 * 验证url是否匹配指定的一组规则
 *
 * @param {string} url 某个path
 * @param {RegExp | string} patterns 验证的表达式或path
 *
 * @return {boolean}
 */
function testURL(url, patterns) {
    return some(
        patterns,
        pattern => (isFunction(pattern.test) ? pattern.test(url) : (pattern === url))
    );
}

/**
 * 验证url是否命中某个导航元素config的规则
 *
 * @param {string} url 某个path，不带#
 * @param {Object} item 一个tab的配置信息
 *
 * @return {boolean}
 */
function isActive(url, item) {
    return !testURL(url, item.exclude || []) && testURL(url, item.include || []);
}

export default class AppModel extends BaseModel {
    menuConfig = {
        items: [],
        index: null
    };

    logoutUrl = '/data/user/logout';

    isReady = false;
    // 状态：normal -> 正常状态；forbidden -> 没权限；notfound -> 页面不存在
    state = 'normal';
    isLoading = false;

    initNav() {
        const config = cloneDeep(this.global.config.nav);
        config.items = this.findAllowedItems(config.items);

        // 默认首页，要看看配置的那个首页有没有权限，如果没有权限，就要找最适合的页面作为首页了
        const backup = this.findFallbackUrl(config.items, config.index);
        if (backup) {
            config.index = backup;
        }
        this.menuConfig = {
            items: this.convertItems(config.items),
            index: config.index
        };
    }

    toggleExpand(item) {
        this.$set(item, 'expanded', !item.expanded);
    }

    /**
     * 激活有权限的导航菜单项
     *
     * @public
     * @param {string} currentUrl 激活依据的 url ，这个 url 可能不是导航菜单项中的 url ，
     *                            可能是某个菜单项 includes 里面包含的 url
     */
    activeNav(currentUrl) {
        function activeItems(items) {
            return map(items, item => {
                let active = this.isContainUrl(item, currentUrl);
                let subItems = activeItems.call(this, item.items);

                this.$set(item, 'active', active);
                if (active) {
                    this.$set(item, 'expanded', true);
                }
                this.$set(item, 'item', subItems);
                return item;
            });
        }
        currentUrl = normalizeHash(currentUrl);
        return activeItems.call(this, this.menuConfig.items);
    }

    /**
     * 判断 url 是否在用户配置的导航列表里面
     *
     * @public
     * @param {string} url 待判断的 url
     * @return {boolean}
     */
    isNavContainsUrl(url) {
        let check = (url, items) => some(items, item => {
            if (item.url && item.url === url) {
                return true;
            }

            return check(url, item.items);
        });
        return check(this.global.config.nav.items);
    }

    /**
     * 判断指令路径是否配置在了 vue router 里面
     *
     * @public
     * @param {string} url 路径
     */
    isRouteContainsUrl(url) {
        return !!this.global.router.match(url).matched.length;
    }

    /**
     * 在没有hashurl的时候，如果config.index配置的url在allowedItems里面能找到对应的项，那么就可以直接使用；
     * 如果找不到，那就要找个最合适的item对应的url。
     *
     * @private
     * @param  {Array.<Object>} allowedItems 有权限的菜单项配置
     * @param  {string} preferUrl    config.index中想要跳转的url
     * @return {string} 备胎url
     */
    findFallbackUrl(allowedItems, preferUrl) {
        if (!allowedItems.length) {
            return;
        }

        let backup = walk(allowedItems, preferUrl);

        if (!backup) {
            backup = findBestMatchItemUrl(allowedItems);
        }

        function findBestMatchItemUrl(items) {
            if (!items.length) {
                return;
            }
            let preferredItem = find(items, item => !item.externalUrl);
            if (!preferredItem) {
                preferredItem = items[0].url;
            }
            // 如果 items 只有一个配置了 externalUrl 的元素，就会导致 preferredItem 是 undefined
            return preferredItem && preferredItem.url;
        }

        function walk(items, preferUrl, isParentEqual = false) {
            let backup;
            find(items, item => {
                // 必须要去到叶子节点，才能知道是不是有权限
                if (item.items && item.items.length) {
                    backup = walk(item.items, preferUrl, isParentEqual || item.url === preferUrl);
                }
                // 已经到了叶子节点了
                else if (item.url === preferUrl) {
                    backup = preferUrl;
                }

                // 如果找到了“备胎”，就不再管后面的配置了。
                return backup;
            });

            // 祖先层级已经有相等的url了，却没有在当前层找到相等的url配置，说明这个url没有权限，
            // 此时就在本层找一个有权限的url就好了。
            if (!backup && isParentEqual) {
                backup = findBestMatchItemUrl(items);
            }

            return backup;
        }

        return backup;
    }

    /**
     * 找出有权限的菜单项，后续只会显示出这些有权限的菜单项
     *
     * @private
     * @param {Array.<string>} items 所有配置的菜单项
     * @return {Array.<Object>} 有权限的菜单项
     */
    findAllowedItems(items) {
        let allowedItems = [];
        each(items, originItem => {
            let clonedItem = clone(originItem);
            if (this.isAllow(clonedItem.auth)) {
                if (clonedItem.items && clonedItem.items.length) {
                    clonedItem.items = this.findAllowedItems(clonedItem.items);

                    // 顺便修正一下当前item的url配置（因为这个配置对应的子item可能没权限）
                    if (
                        clonedItem.items
                        && clonedItem.items.length
                        && !some(clonedItem.items, subItem => subItem.url === clonedItem.url)
                    ) {
                        clonedItem.url = clonedItem.items[0].url;
                    }
                }
                allowedItems.push(clonedItem);
            }
        });
        return allowedItems;
    }

    // 将菜单项转换成界面直接能用的
    convertItems(items) {
        return map(items, item => {
            let subItems = this.convertItems(item.items);
            let sidebarItem = {
                items: subItems,
                text: item.text,
                url: item.url ? normalizeHash(item.url) : '',
                icon: item.icon,
                id: uniqueId(),
                externalUrl: item.externalUrl,
                target: item.target,
                include: Array.isArray(item.include)
                    ? item.include
                    : (item.include ? [item.include] : []),
                exclude: Array.isArray(item.exclude)
                    ? item.exclude
                    : (item.exclude ? [item.exclude] : [])
            };
            return sidebarItem;
        });
    }

    /**
     * 判断是否具备权限
     *
     * @param  {string|Array.<string>}  authList 权限列表，列表项之间是“或”的关系
     * @return {boolean}
     */
    isAllow(authList) {
        if (!authList) {
            return true;
        }

        if (isString(authList)) {
            authList = [authList];
        }

        return some(authList, auth => this.global.isAllow(auth));
    }

    /**
     * 判断某个url是不是在指定的菜单项下
     *
     * @private
     * @param {Object} item 菜单项配置
     * @param {string} url url
     * @return {boolean}
     */
    isContainUrl(item, url) {
        // 先去掉各种参数，再参与比较
        url = url.split('?')[0];
        return url === item.url || isActive(url, item);
    }
}
