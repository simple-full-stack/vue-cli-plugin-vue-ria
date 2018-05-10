import { createView, BaseView } from 'sfs-vue-ria';
import Vue from 'vue';
import { PageComponent } from 'sfs-vue-ria/types/views/createView';
import pathModule from './pathModule';

export default createView(BaseView, pathModule, {
  name: 'path-view',
  render() {
    const Parent = Vue.extend(this.$options.components['base-view'] as PageComponent);
    return <Parent class="path-view"></Parent>;
  },
});
