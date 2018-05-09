import Ria from 'sfs-vue-ria';
import { api } from '@/common/config';
import routes from './routes';
import './main.less';
import AppView from './AppView';
import nav from './nav';

const ria = new Ria();
ria.config.api = api;
ria.config.routes = routes;
ria.config.nav = nav;
ria.AppComponent = AppView;
ria.start();
