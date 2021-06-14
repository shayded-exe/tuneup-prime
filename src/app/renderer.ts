import './scss/app.scss';

import * as store from '@/store';
import { getOS, SupportedOS } from '@/utils';
import Buefy from 'buefy';
import { Color, Titlebar } from 'custom-electron-titlebar';
import Vue from 'vue';

import App from './app.vue';
import { router } from './router';

function init() {
  function initVue() {
    Vue.config.productionTip = process.env.NODE_ENV === 'production';

    Vue.use(Buefy, {
      defaultIconPack: 'fas',
    });

    new Vue({
      router,
      render: h => h(App),
    }).$mount('#app');

    if (getOS() === SupportedOS.Windows) {
      new Titlebar({
        backgroundColor: Color.fromHex('#1e1e1e'),
        menu: null,
        maximizable: false,
      });
    }
  }

  store.init();
  initVue();

  // if (module.hot) {
  //   window.addEventListener('message', e => {
  //     if (process.env.NODE_ENV !== 'production') {
  //       console.clear();
  //     }
  //   });
  // }
}

init();
