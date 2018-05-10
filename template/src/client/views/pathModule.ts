import { baseModule, createModule } from 'sfs-vue-ria';

export default createModule(baseModule, {
  state() {
    return {
      title: '这是标题',
    };
  },
});
