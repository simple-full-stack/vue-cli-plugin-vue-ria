<template>
    <div class="ria-sidebar"
        :class="{
            collapsed: state === 'collapsed',
            'nav-empty': state === 'hidden'
        }">
        <ul class="subnav" v-if="state === 'collapsed'">
            <li v-for="(subItem, index) in menu"
                :key="index"
                class="nav-item"
                :class="{
                    'nav-item-open': menuExtra[index] && menuExtra[index].open,
                    'nav-item-has-active-child': hasActive(subItem.items),
                    'nav-item-current': subItem.active
                }">
                <span class="nav-item-icon"
                    @mouseover="openLayer(index)"
                    :ref="`nav-${index}`">
                    <veui-icon v-if="subItem.icon"
                        :name="subItem.icon"></veui-icon>
                </span>
                <veui-overlay
                    v-if="menuExtra[index].open"
                    :open="menuExtra[index].open"
                    :target="`nav-${index}`"
                    :options="{attachment: 'top left', targetAttachment: 'top right', offset: '14px -10px'}"
                    overlay-class="ria-sidebar-item-layer"
                >
                    <div class="nav-item"
                        :class="{
                            'nav-item-current': subItem.active,
                            'nav-item-has-active-child': hasActive(subItem.items),
                            'nav-item-expanded': subItem.expanded,
                            'nav-item-collapsed': !subItem.expanded
                        }"
                        v-outside="{
                            refs: [`nav-${index}`],
                            delay: 300,
                            handler: () => closeLayer(index),
                            trigger: 'hover'
                        }">

                        <div v-if="subItem.items && subItem.items.length"
                            @click="toggleItem(subItem)"
                            class="nav-item-row">
                            <a class="nav-item-row-label">{{ subItem.text }}</a>
                            <veui-icon name="angle-right" class="expand-icon"></veui-icon>
                        </div>
                        <div v-else-if="subItem.externalUrl" class="nav-item-row">
                            <a :href="subItem.externalUrl" :target="subItem.target || '_self'">{{ subItem.text }}</a>
                        </div>
                        <div v-else class="nav-item-row">
                            <router-link :to="subItem.url" class="nav-item-row-label">{{ subItem.text }}</router-link>
                        </div>

                        <ul class="subnav"
                            v-if="subItem.items && subItem.items.length"
                            v-show="subItem.expanded"
                            @click.native.stop>
                            <li v-for="(thirdItem, index) in subItem.items"
                                :key="index"
                                class="nav-item"
                                :class="{'nav-item-current': thirdItem.active}">

                                <div v-if="thirdItem.externalUrl" class="nav-item-row">
                                    <a class="nav-item-row-label" :href="thirdItem.externalUrl" :target="thirdItem.target || '_self'">{{ thirdItem.text }}</a>
                                </div>
                                <div v-else class="nav-item-row">
                                    <router-link class="nav-item-row-label" :to="thirdItem.url">{{ thirdItem.text }}</router-link>
                                </div>

                            </li>
                        </ul>
                    </div>
                </veui-overlay>
            </li>
        </ul>
        <ul class="subnav" v-else-if="state === 'visible'">
            <li v-for="(subItem, index) in menu"
                :key="index"
                class="nav-item"
                :class="{
                    'nav-item-current': subItem.active,
                    'nav-item-has-active-child': hasActive(subItem.items),
                    'nav-item-expanded': subItem.expanded,
                    'nav-item-collapsed': !subItem.expanded
                }">
                <veui-icon v-if="subItem.items" :name="subItem.icon"></veui-icon>

                <div v-if="subItem.items && subItem.items.length"
                    @click="toggleItem(subItem)"
                    class="nav-item-row">
                    <a class="nav-item-row-label">{{ subItem.text }}</a>
                    <veui-icon name="ria-angle-right" class="expand-icon"></veui-icon>
                </div>
                <div v-else-if="subItem.externalUrl" class="nav-item-row">
                    <a :href="subItem.externalUrl" class="nav-item-row-label" :target="subItem.target || '_self'">{{ subItem.text }}</a>
                </div>
                <div class="nav-item-row" v-else>
                    <router-link :to="subItem.url" class="nav-item-row-label">{{ subItem.text }}</router-link>
                </div>

                <!-- 三级菜单开始 -->
                <ul class="subnav"
                    v-if="subItem.items && subItem.items.length"
                    v-show="subItem.expanded"
                    @click.native.stop>
                    <li v-for="(thirdItem, index) in subItem.items"
                        :key="index"
                        class="nav-item"
                        :class="{'nav-item-current': thirdItem.active}">

                        <div v-if="thirdItem.externalUrl" class="nav-item-row">
                            <a class="nav-item-row-label" :href="thirdItem.externalUrl" :target="thirdItem.target || '_self'">{{ thirdItem.text }}</a>
                        </div>
                        <div v-else class="nav-item-row">
                            <router-link class="nav-item-row-label" :to="thirdItem.url">{{ thirdItem.text }}</router-link>
                        </div>

                    </li>
                </ul>
                <!-- 三级菜单结束 -->
            </li>
        </ul>
        <button type="button"
            class="ria-sidebar-toggle-button"
            @click="toggle()"
            v-if="state !== 'hidden'">
            <veui-icon name="ria-side-collapse"></veui-icon>
            <span class="ria-sidebar-toggle-button-text">收起</span>
        </button>
    </div>
</template>

<script>
import {Icon, Tooltip, Overlay} from 'veui';
import outside from 'veui/directives/outside';
import {includes, some} from 'lodash';
import '../assets/icons/ria-side-collapse.svg';
import '../assets/icons/ria-angle-right.svg';

export default {
    name: 'ria-sidebar',
    components: {
        'veui-icon': Icon,
        'veui-tooltip': Tooltip,
        'veui-overlay': Overlay
    },
    directives: {
        outside
    },
    props: {
        menu: {
            type: Array,
            default() {
                return [];
            }
        },
        state: {
            type: String,
            validator(val) {
                return includes(['collapsed', 'visible', 'hidden'], val);
            }
        }
    },
    data() {
        return {
            menuExtra: []
        };
    },
    created() {
        this.fillMenuExtra();
    },
    watch: {
        menu() {
            this.fillMenuExtra();
        }
    },
    methods: {
        fillMenuExtra() {
            this.menuExtra = this.menu.map((item, index) => {
                let extraItem = this.menuExtra[index] || {open: false};
                return extraItem;
            });
        },
        openLayer(index) {
            let item = this.menuExtra[index] || {};
            this.$set(item, 'open', true);
            this.$set(this.menuExtra, index, item);
        },
        closeLayer(index) {
            let item = this.menuExtra[index] || {};
            this.$set(item, 'open', false);
            this.$set(this.menuExtra, index, item);
        },
        hasActive(items) {
            return some(items, item => item.active);
        },
        toggleItem(item) {
            this.$emit('toggleitem', item);
        },
        toggle() {
            this.$emit('toggle');
        }
    }
};
</script>

<style lang="less">
@import "../assets/css/lib.less";

.ria-sidebar {
    @static-item-height: 48px;
    @layer-item-height: 40px;

    @static-icon-size: 14px;
    @expand-icon-size: 12px;

    position: fixed;
    width: @ria-sidebar-width;
    top: @ria-header-height;
    bottom: 0;
    left: 0;
    transition: left .1s, border-width .1s;

    &-toggle-button {
        height: @static-item-height;
        font-size: @ria-font-size-normal;
        color: @ria-text-color-normal;
        margin: 10px 20px;
        padding: 0;

        .veui-icon {
            vertical-align: middle;
            margin-right: 20px;
        }

        &,
        &:hover {
            background: transparent;
            border: none;
        }

        &:hover {
            color: @ria-text-color-strong;
        }
    }

    .common-sub-menu() {
        ul {
            .reset-list-style();
            padding: 0;
            margin: 0;
        }

        .nav-item {
            & > .nav-item-row,
            & > .veui-icon {
                color: @ria-text-color-strong;

                a {
                    color: inherit;
                }
            }

            & > .nav-item-row {
                cursor: pointer;
                position: relative;
            }

            & > .veui-icon {
                margin-right: 20px;
                margin-top: (@static-item-height - @static-icon-size) / 2;
                .size(@static-icon-size);
            }

            &-row-label {
                padding: 4px 0;
            }
        }

        .expand-icon {
            .size(12px);
            transform: rotateZ(90deg);
            margin-top: (@static-item-height - @expand-icon-size) / 2;
            float: right;
        }

        .nav-item-expanded .expand-icon {
            transform: rotateZ(-90deg);
        }

        .nav-item-row:hover .nav-item-row-label,
        .nav-item-current > .nav-item-row .nav-item-row-label,
        .nav-item-current > .nav-item-row:hover .nav-item-row-label,
        .nav-item-has-active-child.nav-item-collapsed > .nav-item-row .nav-item-row-label,
        .nav-item-has-active-child.nav-item-collapsed > .nav-item-row:hover .nav-item-row-label {
            border-bottom: 2px solid @ria-gray-color-1;
        }

        .nav-item-row:hover .nav-item-row-label {
            border-color: @ria-gray-color-3;
        }

        .nav-item-current.nav-item-has-active-child.nav-item-expanded > .nav-item-row .nav-item-row-label {
            border: none;
        }
    }

    .common-sub-menu();
    .nav-item-row {
        font-size: @ria-font-size-large;
        width: ~"calc(100% - 34px)";
        line-height: @static-item-height;
    }

    .nav-item {
        .clearfix();

        & > .nav-item-row,
        & > .veui-icon {
            float: left;
        }

        &-row-label {
            display: inline-block;
            line-height: 1;
            max-width: 130px;
            .ellipsis();
            margin-top: ~"calc(20px - .5em)";
            vertical-align: top;
        }
    }

    & > .subnav {
        margin: 32px 20px 0;
        padding-bottom: 14px;
        border-bottom: 1px solid #dbdbdb;

        .subnav {
            margin-left: 35px;
            clear: left;
        }
    }

    // 整个侧边栏收起来的样式
    &.collapsed {
        width: @ria-sidebar-collapsed-width;

        .nav-item {
            .centered-line(@static-item-height);

            .nav-item-icon {
                font-size: 0;
                display: inline-block;
                line-height: 1;
                margin: 16px 0 0;
                padding-bottom: 4px;
            }
            &-open .nav-item-icon,
            .nav-item-icon:hover,
            &-has-active-child .nav-item-icon,
            &-current .nav-item-icon {
                border-bottom: 2px solid @veui-gray-color-3;
            }
            .veui-icon {
                cursor: pointer;
                font-size: 14px;
            }

            &-has-active-child .nav-item-icon,
            &-current .nav-item-icon,
            .nav-item-icon:active {
                &,
                &:hover {
                    border-color: @veui-gray-color-1;
                }
            }
        }

        .ria-sidebar-toggle-button {
            .veui-icon {
                transform: rotateZ(180deg);
            }

            &-text {
                display: none;
            }
        }
    }

    &-item-layer {
        background: #fff;
        box-shadow: 0 1px 4px 0 rgba(0, 0, 0, .2);
        padding: 0 10px;
        width: 166px;

        .common-sub-menu();

        .nav-item-row {
            font-size: @ria-font-size-normal;
            line-height: @layer-item-height;
        }

        .expand-icon {
            margin-top: (@layer-item-height - @expand-icon-size) / 2;
        }
    }
}
</style>
