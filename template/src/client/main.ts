import Ria from 'sfs-vue-ria';
import 'sfs-vue-ria/src/componentsTheme';
import cfg from '@/common/config';
import routes from './routes';
import './main.less';
import AppView from './AppView';
import nav from './nav';

new class extends Ria {
  protected config = {
    api: cfg.api,
    routes: routes.client,
    nav: nav.client,
  };

  protected AppComponent = AppView;
}().start();
