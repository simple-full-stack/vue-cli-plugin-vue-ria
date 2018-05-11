import { createModule, formModule } from 'sfs-vue-ria';

export default createModule(formModule, {
  state() {
    return {
      title: '表单页',
    };
  },
});
