import './scss/app.scss';

import Buefy from 'buefy';
import { Color, Titlebar } from 'custom-electron-titlebar';
import Vue from 'vue';

import App from './app.vue';
import { router } from './router';

Vue.config.productionTip = false;
Vue.use(Buefy);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');

new Titlebar({
  backgroundColor: Color.fromHex('#1e1e1e'),
  menu: null,
  maximizable: false,
});
