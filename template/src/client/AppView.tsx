import { createView, AppView } from 'sfs-vue-ria';
import { PageComponent } from 'sfs-vue-ria/types/views/createView';
import Vue from 'vue';
import appModule from './appModule';

export default createView(AppView, appModule, {
  name: 'app-name-app-view',
  render() {
    const Parent = Vue.extend(this.$options.components['app-view'] as PageComponent);
    return <Parent>111</Parent>;
  },
});
