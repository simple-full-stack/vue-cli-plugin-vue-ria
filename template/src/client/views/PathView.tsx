import { createView, BaseView } from 'sfs-vue-ria';
import pathModule from './pathModule';

export default createView(BaseView, pathModule, {
  name: 'path-view',
  render() {
    const Parent = this.getComponent('base-view');
    return <Parent class="path-view"></Parent>;
  },
});
