<template>
    <app-view>
        <div class="logo" slot="logo">Put your app logo here.</div>
    </app-view>
</template>

<script>
import createView from 've-ria/views/createView';
import AppView from 've-ria/views/AppView';
import AppModel from './AppModel';

export default createView(AppView, AppModel, {
    // 改成自己的名称
    name: 'app-name-app-view'
});
</script>

<style lang="less">

</style>
