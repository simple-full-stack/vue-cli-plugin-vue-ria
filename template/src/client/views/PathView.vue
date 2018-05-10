<template>
    <base-view class="path-view">path1</base-view>
</template>

<script>
import { createView, BaseView } from 'sfs-vue-ria';
import pathModule from './pathModule';

export default createView(BaseView, pathModule, {
  name: 'path-view',
});
</script>

<style lang="less">
@page-class-name: path-view;

.@{page-class-name} {

}
</style>
