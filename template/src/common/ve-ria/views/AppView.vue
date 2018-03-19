<template>
    <div id="app" class="app-view">
        <slot name="before">
            <div class="one-stop">
                <slot name="oneStop"></slot>
            </div>
        </slot>

        <div class="header">
            <slot name="logo">
                <a class="logo" href="#">logo</a>
            </slot>
            <ul class="nav">
                <li class="nav-item"
                    v-for="(item, index) in store.menuConfig.items"
                    :key="index"
                    :class="{'nav-item-current': item.active}">
                    <veui-icon v-if="item.icon" :name="item.icon"></veui-icon>
                    <a v-if="item.externalUrl" :href="item.externalUrl" :target="item.target || '_self'">{{ item.text }}</a>
                    <router-link v-else :to="item.url || ''">{{ item.text }}</router-link>
                </li>
            </ul>
            <slot name="header-extra">
                <template v-if="store.isReady">
                    <div class="header-user-info">
                        <slot name="beforeAccount"></slot>
                        <slot name="account">
                            <veui-icon name="ria-account"></veui-icon>
                            <span class="username">{{ global.session.visitor.userName }}</span>
                        </slot>
                        <slot name="afterAccount">
                            <form :action="store.logoutUrl" method="POST">
                                <button class="exit" type="submit"><veui-icon name="ria-exit"></veui-icon></button>
                            </form>
                        </slot>
                    </div>
                </template>
            </slot>
        </div>

        <ria-sidebar class="sidebar"
            :menu="subMenu"
            :state="global.sidebarState"
            @toggleitem="toggleItemExpanded"
            @toggle="toggleSidebar">
        </ria-sidebar>

        <template v-if="store.isReady">
            <forbidden class="main" v-if="store.state === 'forbidden'"></forbidden>
            <notfound class="main" v-else-if="store.state === 'notfound'"></notfound>
            <router-view class="main" v-else-if="store.state === 'normal'"></router-view>
        </template>

        <div class="footer copyright">
            ©<span class="year" v-once>{{ (new Date).getFullYear() }}</span>Baidu&nbsp;
            <a target="_blank" href="https://www.baidu.com/duty/">使用百度前必读</a>
            | 京ICP证030173号
        </div>

        <veui-overlay :open.sync="store.isLoading"
            overlay-class="global-loading"
            :priority="99999">
            <div class="loading-icon" v-once><loading></loading></div>
        </veui-overlay>

        <slot name="after"></slot>
    </div>
</template>

<script>
import 'vue-awesome/icons/sort-down';
import 'vue-awesome/icons/shopping-cart';
import {find, isEqual, assign} from 'lodash';
import {Overlay, Icon, Button, Tooltip} from 'veui';
import Forbidden from './Forbidden';
import Notfound from './Notfound';
import AppModel from './AppModel';
import Loading from '../components/Loading';
import createView from './createView';
import Sidebar from '../components/Sidebar';
import 'veui-theme-one/assets/icons/angle-right.svg';
import '../assets/icons/ria-exit.svg';
import '../assets/icons/ria-account.svg';

export default createView(null, AppModel, {
    name: 'app-view',
    components: {
        'veui-overlay': Overlay,
        'veui-icon': Icon,
        'veui-button': Button,
        'veui-tooltip': Tooltip,
        'ria-sidebar': Sidebar,
        Loading,
        Forbidden,
        Notfound
    },
    computed: {
        subMenu() {
            let curMainMenu = find(this.store.menuConfig.items, menuItem => menuItem.active);
            return curMainMenu ? curMainMenu.items : [];
        },
        visitor() {
            if (!this.global.session) {
                return {};
            }
            return this.global.session.visitor || {};
        }
    },
    watch: {
        'global.loadingCounter'(value) {
            this.store.isLoading = !!value;
        },
        'global.redirectUrl'(v, oldV) {
            if (!isEqual(v, oldV)) {
                switch (v.type) {
                    case 'push':
                    case 'replace':
                        this.$router[v.type](v.url);
                        break;
                    case 'back':
                        this.$router.back();
                        break;
                    case 'reload':
                        location.reload();
                        break;
                    default:
                        break;
                }

                // 跳完之后重置一下 redirectUrl
                assign(this.global.redirectUrl, {
                    type: undefined,
                    url: undefined
                });
            }
        },
        subMenu(value) {
            if (!value || !value.length) {
                this.global.setSidebarState('hidden');
            }
            else if (this.global.sidebarState === 'hidden') {
                this.global.setSidebarState('visible');
            }
        }
    },
    async created() {
        await Promise.all([this.global.requestConstants(), this.global.requestSession()]);

        this.global.initUser(this.global.session);
        this.store.initNav();

        const currentPath = this.store.getRoutePath();
        // 如果在所有路径配置中都找不到匹配的，就直接到 404 界面了
        if (!this.store.isRouteContainsUrl(currentPath)) {
            this.store.state = 'notfound';
        }
        // 如果当前路径有权限，那直接就这个 path 了。
        // 如果当前路径没有设置权限，认为该路径有权限。
        // 注意：某些路径有权限，但是并没有配置在 config.nav 里面。
        else if (this.store.isAllow(this.$route.meta.auth)) {
            this.store.state = 'normal';
            this.store.activeNav(currentPath);
        }
        // 没找到合适的 config.index
        else if (!this.store.menuConfig.index) {
            // 有如下三种情况：
            // 1. 当前路径在配置的导航菜单项里面（此时肯定也在全部路由列表 vue router 里面），但却没找到 config.index ，
            //    其实就说明所有的菜单项都是没权限的，因此当前路径也是没权限的，需要 redirect 到 forbidden 页面。
            // 2. 当前路径没在配置的导航菜单项里面，但是在全部路由列表（ vue router ）里面，此时就要检查一下该路径是否有权限了，
            //    如果有权限，就让过；如果没权限，就跳转到 forbidden 页面。
            //    由于上面一个 if 分支检测了权限情况，所以本流程不会出现在此条件分支中。
            // 3. 当前路径不在全部路由列表里面，此时直接 redirect 到 404 页面。
            this.store.state = this.store.isNavContainsUrl(currentPath)
                ? 'forbidden' : 'notfound';
        }
        // 有合适的 config.index，但是当前路径不是这个 config.index，并且还没通过权限检测（第一个 if 分支），
        // 此时需要跳转到第一个有权限的地址（ config.index ）。
        else if (currentPath !== this.store.menuConfig.index) {
            this.global.redirect({
                url: this.store.menuConfig.index,
                type: 'push'
            });
        }

        this.$router.beforeEach((to, from, next) => {
            if (!this.store.isRouteContainsUrl(to.path)) {
                this.store.state = 'notfound';
            }
            else if (this.store.isAllow(to.meta.auth)) {
                this.store.activeNav(to.path);
                this.store.state = 'normal';
            }
            else {
                this.store.state = 'forbidden';
            }

            // 有瑕疵的页面也让跳转过去，主要为了地址栏能显示出有瑕疵页面的地址。
            next();
        });

        this.store.isReady = true;
        this.$emit('ready', this.global.session);
    },
    methods: {
        toggleItemExpanded(subItem) {
            this.store.toggleExpand(subItem);
        },
        toggleSidebar() {
            if (this.global.sidebarState === 'collapsed') {
                this.global.setSidebarState('visible');
            }
            else {
                this.global.setSidebarState('collapsed');
            }
        }
    }
});
</script>
<style lang="less">
@import "../assets/css/lib.less";

.app-view {
    overflow: hidden;
    background-color: @ria-background-color;
    min-height: 100%;
}

.one-stop {
    height: 34px;
    background: #eceef3;
    display: none;
}

.header {
    .clearfix();
    position: fixed;
    width: calc(~"100% - "@ria-main-padding-horizon * 2);
    // Tabs 组件里面有 z-index 为 1 的元素
    // ButtonGroup 组件里面可能出现 z-index 为 2 的元素
    z-index: 3;
    height: @ria-header-height;
    min-width: @ria-screen-min-width - @ria-main-padding-horizon * 2 - @ria-scrollbar-width;
    border-bottom: 1px solid @ria-gray-color-6;
    margin: 0 @ria-main-padding-horizon;
    background: @ria-background-color;

    &-user-info {
        float: right;
        margin-top: 30px;

        .veui-icon {
            vertical-align: -2px;
        }

        form {
            display: inline-block;
        }

        .exit {
            background: none;
            border: none;
            padding: 0;
        }

        .username {
            margin-right: 30px;
            margin-left: 5px;
        }
    }
}

.logo,
.nav {
    float: left;
}

.nav {
    margin: 0;
    padding: 0;
    list-style: none;

    .nav-item {
        float: left;

        a {
            display: block;
            .centered-line(@ria-header-height);
            margin-right: 20px;
            padding: 0 24px;
            opacity: .8;
            outline: none;
            color: @ria-gray-color-1;
            font-weight: 400;
            font-size: 16px;
        }

        &-current {
            font-weight: 400;
        }

        &-current a,
        a:hover {
            opacity: 1;
            color: #55ACEF;
            border-bottom: 2px solid;
        }

        &:last-child a {
            margin-right: 0;
        }
    }
}

.help {
    position: absolute;
}

.nav-empty {
    display: none;
}

.main {
    .clearfix();
    box-sizing: border-box;
    margin: @ria-header-height + @ria-main-padding-vertical @ria-main-padding-horizon @ria-main-padding-vertical;
    min-width: @ria-screen-min-width - @ria-sidebar-width - 2 * @ria-main-padding-horizon - @ria-scrollbar-width;
    background: #fff;
    padding: 30px;

    .sidebar + & {
        margin-left: @ria-sidebar-width;
    }

    .sidebar.collapsed + & {
        margin-left: @ria-sidebar-collapsed-width;
    }

    .nav-empty + & {
        margin-left: @ria-main-padding-horizon;
        min-width: @ria-screen-min-width - 2 * @ria-main-padding-horizon - @ria-scrollbar-width;
    }
}

.copyright {
    text-align: center;
    font-size: 14px;
    margin: 27px 0;

    &,
    & a,
    & a:hover {
        color: @ria-gray-color-3;
    }

    .year {
        margin: 0 4px;
    }
}

.global-loading {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(63, 63, 63, .6);
    text-align: center;
    color: #fff;
    padding-top: 200px;

    .loading-icon {
        .size(100px);
        padding: 10px;
        box-sizing: border-box;
        margin: auto;
        background: rgba(0, 0, 0, .7);
        border-radius: 4px;
    }
}
</style>
