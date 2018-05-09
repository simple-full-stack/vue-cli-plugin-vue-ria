<template>
  <app-view>
    <div class="logo" slot="logo">Put your app logo here.</div>
  </app-view>
</template>

<script>
import {createView, AppView} from 'sfs-vue-ria';
import appModule from './appModule';

export default createView(AppView, appModule, {
  // 改成自己的名称
  name: 'app-name-app-view'
});
</script>

<style lang="less">

</style>
