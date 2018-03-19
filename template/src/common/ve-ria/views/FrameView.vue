<template>
    <base-view class="frame-view"
        :class="[`frame-view-${store.frameState}`]">
        <ria-quick-tree :datasource="store.frameDatasource"
            :current.sync="store.frameCurrent"
            @select="select"
            :state.sync="store.frameState">
            <template slot="title">{{ store.frameTitle }}</template>
            <template slot="item-all">{{ store.frameItemAll }}</template>
        </ria-quick-tree>
        <slot>
            <slot name="before"></slot>
            <router-view></router-view>
            <slot name="after"></slot>
        </slot>
    </base-view>
</template>

<script>
import createView from './createView';
import BaseView from './BaseView';
import Model from './FrameModel';
import QuickTree from '../components/QuickTree';

export default createView(BaseView, Model, {
    name: 'FrameView',
    components: {
        'ria-quick-tree': QuickTree
    },
    methods: {
        select(option) {
            this.$emit('select', option);
        }
    }
});
</script>

<style lang="less">
@import "../assets/css/lib.less";

.base-view.frame-view {
    @tree-width: 200px;

    .ria-quick-tree {
        position: fixed;
        left: @ria-main-padding-horizon;
        top: @ria-header-height + @ria-main-padding-vertical;
        bottom: @ria-main-padding-vertical;
        height: auto;
        overflow: auto;

        &-head {
            margin-bottom: 0;
        }
    }

    .main& {
        min-width: auto;
    }

    .sidebar + .main&-expand {
        margin-left: @ria-main-padding-horizon + 220px;
    }

    .sidebar + .main&-collapse,
    .sidebar + .main&-collapse-expand {
        margin-left: @ria-main-padding-horizon + 60px;
    }
}
</style>
