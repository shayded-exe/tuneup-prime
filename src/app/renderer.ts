import './scss/app.scss';

import Buefy from 'buefy';
import Vue from 'vue';

import App from './app.vue';
import { router } from './router';

Vue.config.productionTip = false;
Vue.use(Buefy);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
