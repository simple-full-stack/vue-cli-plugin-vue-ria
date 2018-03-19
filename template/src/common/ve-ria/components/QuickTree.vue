<template>
    <div class="ria-quick-tree"
        :class="{
            'ria-quick-tree-expanded': localState === 'expand',
            'ria-quick-tree-collapsed': localState === 'collapse',
            'ria-quick-tree-collapsed-expand': localState === 'collapse-expand'
        }"
        @mouseover="collapsedExpand"
        @mouseout="collapsedRecover">
        <h3 class="ria-quick-tree-head">
            <span class="ria-quick-tree-title"><slot name="title"></slot></span>
            <veui-icon :name="localState === 'expand' ? 'slide-left' : 'slide-right'"
                class="ria-quick-tree-toggle"
                @click.native="toggle"></veui-icon>
        </h3>

        <veui-searchbox ui="small"
            v-model="keyword"
            @search="debounceSearch"
            @input="debounceSearch"
            @select="select"
            placeholder="搜索关键词"
            :suggestions="filteredDatasource">
            <template slot="suggestions" slot-scope="props">
                <veui-tree
                    :datasource="props.suggestions"
                    class="ria-quick-tree-suggestions"
                    :expands="allFilteredValues"
                >
                    <template slot="item" slot-scope="itemProps">
                        <a class="ria-quick-tree-item-label"
                            @click="props.select(itemProps.option)"
                            :title="itemProps.option.label">{{ itemProps.option.label }}</a>
                    </template>
                </veui-tree>
            </template>
        </veui-searchbox>

        <a class="ria-quick-tree-all"
            :class="{'ria-quick-tree-item-current': !localCurrent}"
            @click="select"><slot name="item-all">所有推广计划</slot></a>
        <veui-tree :datasource="datasource" :expands.sync="staticExpands" class="ria-quick-tree-items">
            <template slot-scope="props" slot="item-label">
                <a class="ria-quick-tree-item-label"
                    :class="{
                        'ria-quick-tree-item-current': props.option.value === localCurrent,
                        'ria-quick-tree-item-contains-current': containsCurrent(props.option),
                        'ria-quick-tree-item-collapsed': !props.option.expanded
                    }"
                    @click="select(props.option)"
                    :title="props.option.label">{{ props.option.label}}</a>
            </template>
        </veui-tree>
    </div>
</template>

<script>
import {Tree, Icon, Searchbox} from 'veui';
import {find, includes, debounce, omit} from 'lodash';
import 'veui-theme-one/assets/icons/slide-right.svg';
import 'veui-theme-one/assets/icons/slide-left.svg';

export default {
    name: 'ria-quick-tree',
    components: {
        'veui-searchbox': Searchbox,
        'veui-tree': Tree,
        'veui-icon': Icon
    },
    props: {
        datasource: {
            type: Array,
            default() {
                return [];
            }
        },
        current: {
            type: [String, Number]
        },
        filter: {
            type: Function,
            default(keyword, item) {
                return includes(item.label, keyword);
            }
        },
        state: {
            type: String,
            default: 'expand',
            validator(value) {
                return includes(['expand', 'collapse', 'collapse-expand'], value);
            }
        }
    },
    data() {
        return {
            keyword: '',
            filteredDatasource: [],
            localState: this.state,
            localCurrent: this.current,
            staticExpands: []
        };
    },
    created() {
        let me = this;
        this.debounceSearch = debounce(function (...args) {
            me.search(...args);
        }, 200);
    },
    computed: {
        allFilteredValues() {
            let walk = arr => {
                let ret = [];
                arr.reduce((prev, cur) => {
                    prev.push(cur.value);
                    if (cur.children && cur.children.length) {
                        ret.push(...walk(cur.children));
                    }
                    return prev;
                }, ret);
                return ret;
            };
            return walk(this.filteredDatasource);
        }
    },
    watch: {
        state(value) {
            this.localState = value;
        },
        current(value) {
            this.localCurrent = value;
        }
    },
    beforeDestroy() {
        this.debounceSearch.cancel();
    },
    methods: {
        containsCurrent(option) {
            return option.children && option.children.some(child => child.value === this.localCurrent);
        },
        collapsedRecover() {
            if (this.localState === 'collapse-expand') {
                this.localState = 'collapse';
                this.$emit('update:state', this.localState);
            }
        },
        collapsedExpand() {
            if (this.localState === 'collapse') {
                this.localState = 'collapse-expand';
                this.$emit('update:state', this.localState);
            }
        },
        toggle() {
            this.localState = this.localState === 'expand' ? 'collapse' : 'expand';
            this.$emit('update:state', this.localState);
        },
        select(option) {
            this.localCurrent = option && option.value;
            this.$emit('update:current', this.localCurrent);
            this.$emit('select', option);
        },
        search(keyword) {
            let walk = (options, filteredOptions) => {
                let hasVisibleOption = false;
                options.forEach((option, index) => {
                    let filteredChildren = [];
                    let isSelfVisible = this.filter(keyword, option, index, options, this.datasource);
                    let isChildrenVisible = option.children
                        && option.children.length
                        && walk(option.children, filteredChildren);

                    if (isSelfVisible || isChildrenVisible) {
                        hasVisibleOption = true;
                        filteredOptions.push({
                            ...omit(option, 'children'),
                            expanded: true,
                            children: filteredChildren
                        });
                    }
                });
                return hasVisibleOption;
            };

            let filteredDatasource = [];
            walk(this.datasource, filteredDatasource);
            this.filteredDatasource = filteredDatasource;
        },
        findOptionByValue(options, value) {
            let targetOption;
            find(options, option => {
                if (option.value === value) {
                    targetOption = option;
                }
                else if (option.children && option.children.length) {
                    targetOption = this.findOptionByValue(option.children, value);
                }

                return targetOption;
            });
            return targetOption;
        }
    }
};
</script>

<style lang="less">
@import "../assets/css/lib.less";

.ria-quick-tree {
    @expand-width: 200px;
    @collapse-width: 40px;
    @item-height: 36px;

    width: @expand-width;
    height: 400px;
    padding: 30px;
    background: #fff;

    .veui-tree {
        &-item-group .veui-tree-item-label:first-child {
            margin-left: 0;
        }

        &-item-label {
            max-width: ~"calc(100% - 18px)";
            .ellipsis();
        }
    }

    &-head {
        color: @ria-text-color-normal;
        .clearfix();
        line-height: 20px;
    }

    &-title {
        font-weight: @ria-font-weight-normal;
    }

    &-toggle {
        float: right;
        margin-top: ~"calc(10px - .5em)";
        cursor: pointer;

        &:hover {
            color: @ria-text-color-strong;
        }
    }

    .veui-searchbox {
        width: 100%;
        margin-top: 30px;
    }

    &-all,
    &-all:hover,
    &-item-label,
    &-item-label:hover {
        color: @ria-text-color-strong;
    }

    .veui-tree-item-group &-item-label {
        color: @ria-text-color-normal;
    }

    &-all,
    &-item-label {
        &,
        &:hover {
            padding-bottom: 4px;
        }

        &:hover,
        &.ria-quick-tree-item-current,
        &.ria-quick-tree-item-contains-current.ria-quick-tree-item-collapsed {
            border-bottom: 2px solid @ria-gray-color-3;
        }

        &.ria-quick-tree-item-current,
        &.ria-quick-tree-item-contains-current.ria-quick-tree-item-collapsed {
            border-color: @ria-text-color-strong;
        }
    }

    &-all {
        font-weight: @ria-font-weight-extra-bold;
        display: inline-block;
        margin-top: 30px;
        border-bottom: 2px solid transparent;
    }

    &-suggestions {
        .veui-tree-item,
        .ria-quick-tree-item-label {
            border: none;
            display: block;
            padding: 0 10px;

            &:hover {
                background: @veui-gray-color-8;
            }
            &:active {
                background: @veui-gray-color-6;
            }
        }
    }

    &-collapsed {
        width: @collapse-width;
        padding: 30px 0 0;
        margin: 0;
        box-shadow: 0 1px 4px 0 rgba(0, 0, 0, .2);

        .veui-searchbox,
        .ria-quick-tree-all,
        .ria-quick-tree-items,
        .ria-quick-tree-title {
            display: none;
        }

        .ria-quick-tree-head {
            text-align: center;
        }

        .ria-quick-tree-toggle {
            float: none;
        }
    }

    &-collapsed-expand {
        box-shadow: 0 1px 4px 0 rgba(0, 0, 0, .2);
    }

    &-items {
        height: ~"calc(100% - 158px)";
        margin: 0 -30px;
        padding: 0 30px;
    }
}
</style>
