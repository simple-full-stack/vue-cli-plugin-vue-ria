import { createView, AppView } from 'sfs-vue-ria';
import appModule from './appModule';

export default createView(AppView, appModule, {
  name: 'app-name-app-view',
  render() {
    const Parent = this.getComponent('app-view');
    return <Parent>111</Parent>;
  },
});
