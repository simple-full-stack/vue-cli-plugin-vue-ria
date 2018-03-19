<template>
    <base-view class="list-view">
        <slot name="before"></slot>
        <slot></slot>
        <slot name="header">
            <div class="list-header">
                <slot name="summary">
                    <div class="list-summary"><slot name="summaryContent"></slot></div>
                </slot>
                <slot name="filter">
                    <veui-form :data="store.filter" ui="inline" class="list-filter" @submit="submitSearch">
                        <slot name="filterContent"></slot>
                    </veui-form>
                </slot>
                <slot name="batch">
                    <div class="list-batch">
                        <slot name="batchContent"></slot>
                    </div>
                </slot>
            </div>
        </slot>
        <slot name="table">
            <veui-table :ui="store.tableUI"
                :data="store.tableData"
                :column-filter="store.tableColumns"
                :keys="store.tableKeys"
                :selectable="store.tableSelectable"
                :order-by="store.filter.orderBy"
                :order="store.filter.order"
                @select="tableSelect"
                @sort="tableSort"
                :selected.sync="store.tableSelected">
                <slot name="tableColumns"></slot>
                <template slot="no-data">
                    <template v-if="store.initLoading">
                        <slot name="tableDataLoading">数据加载中</slot>
                    </template>
                    <template v-else>
                        <slot name="tableNoData">没有数据</slot>
                    </template>
                </template>
            </veui-table>
        </slot>
        <slot name="pager">
            <div class="list-pager" v-show="!store.initLoading">
                <veui-pager :page="store.filter.pageNo"
                    :page-size="store.filter.pageSize"
                    :page-sizes="store.pageSizes"
                    :total="store.totalCount"
                    :to="store.pageTo"
                    ui="full"
                    native
                    @pagesizechange="handlePageSizeChange">
                </veui-pager>
            </div>
        </slot>
        <slot name="after"></slot>
    </base-view>
</template>

<script>
import BaseView from './BaseView';
import {Pagination, Form, Table} from 'veui';
import ListModel from './ListModel';
import createView from './createView';

export default createView(BaseView, ListModel, {
    name: 'list-view',
    components: {
        BaseView,
        'veui-form': Form,
        'veui-table': Table,
        'veui-pager': Pagination
    },
    created() {
        this.global.redirect({
            url: this.store.getQueryUrl(),
            type: 'replace'
        });
        this.store.initListData();
        this.store.generatePageTo();
        this.store.fillFilterFromQuery();

        this.$watch('$route.query', this.handleQueryChange);

        const unwatch = this.$watch(
            () => !this.global.requestCounter,
            () => {
                this.store.initLoading = false;
                unwatch();
            }
        );
    },
    watch: {
        '$route.query.pageNo'(v) {
            this.store.pageNoChange(parseInt(v, 10) || 1);
        }
    },
    methods: {
        // 必须延时比较，因为有可能同时修改 order 和 orderBy ，如果不延时比较，就会调用两次 requestList。
        handleQueryChange(v, oldV) {
            if (!this.queryCheckTask) {
                this.$nextTick(() => {
                    this.queryCheckTask();
                    this.queryCheckTask = null;
                });
            }

            this.queryCheckTask = () => {
                this.store.requestList();
                this.store.generatePageTo();
                this.store.fillFilterFromQuery();
            };
        },
        handlePageSizeChange(pageSize) {
            this.store.pageSizeChange(pageSize);
        },
        tableSelect(...args) {
            this.store.tableSelect(...args);
        },
        tableSort(...args) {
            this.store.tableSort(...args);
        },
        submitSearch() {
            this.store.submitSearch();
        }
    }
});
</script>

<style lang="less">
@import "~less-plugin-est/src/util.less";

.base-view.list-view {
    .list-summary {
        padding: 10px 0;

        &:empty {
            padding: 0;
        }
    }

    .list-header {
        margin: 30px 0 40px;

        &:first-child {
            margin-top: 0;
        }

        .list-filter {
            .filter-right {
                margin-left: 0;
            }
        }
    }

    .list-filter {
        .veui-fieldset:last-child,
        .veui-field:last-child {
            margin-bottom: 0;
        }

        .filter-left {
            float: left;
        }

        .filter-right {
            float: right;
        }
    }

    .list-pager {
        .clearfix();
        margin-top: 10px;

        .veui-pager {
            float: right;
        }

        .veui-pager-switch {
            padding-right: 0;
        }
    }
}
</style>
