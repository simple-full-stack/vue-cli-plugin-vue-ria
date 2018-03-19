<template>
    <base-view class="path-view">path1</base-view>
</template>

<script>
import createView from 've-ria/views/createView';
import BaseView from 've-ria/views/BaseView';
import Model from './PathModel';

export default createView(BaseView, Model, {
    name: 'path-view'
});
</script>

<style lang="less">
@page-class-name: path-view;

.@{page-class-name} {

}
</style>
