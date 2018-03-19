<template>
    <div class="base-view">
        <slot name="before"></slot>
        <h3 v-if="store.title" class="title"><slot name="title">{{ store.title }}</slot></h3>
        <veui-steps v-if="store.stepsData && store.stepsData.length"
            :current="store.stepsCurrent"
            :steps="store.stepsData">
        </veui-steps>
        <veui-breadcrumb v-if="store.crumbData && store.crumbData.length" :routes="store.crumbData">
            <template slot-scope="scope">{{ scope.route.text }}</template>
            <template
                slot="separator"
                slot-scope
                v-if="store.crumbSeparator"
            ><veui-icon :name="store.crumbSeparator"></veui-icon></template>
        </veui-breadcrumb>
        <slot></slot>
        <slot name="after"></slot>
    </div>
</template>

<script>
import BaseModel from './BaseModel';
import {Steps, Breadcrumb, Icon} from 'veui';
import createView from './createView';

export default createView(null, BaseModel, {
    name: 'BaseView',
    components: {
        'veui-steps': Steps,
        'veui-breadcrumb': Breadcrumb,
        'veui-icon': Icon
    }
});
</script>

<style lang="less">
@import '../assets/css/variables.less';

.base-view {
    & > .veui-breadcrumb,
    & > .veui-steps,
    & > h3 {
        margin-bottom: 30px;
    }

    & > h3 {
        font-weight: 700;
    }

    .title {
        color: @ria-text-color-normal;
    }
}
</style>
