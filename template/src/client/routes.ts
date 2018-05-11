import ClientPath from './views/PathView';
import FormView from './views/FormView';

export default {
  client: [
    {
      path: '/path1',
      component: ClientPath,
    },
    {
      path: '/form',
      component: FormView,
    },
  ],
};
