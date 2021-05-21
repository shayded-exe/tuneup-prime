import Vue from 'vue';
import VueRouter from 'vue-router';

import HomePage from './views/home-page.vue';
import SettingsPage from './views/settings-page.vue';
import SmartCommand from './views/smart-command.vue';

Vue.use(VueRouter);

export const router = new VueRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
    },
    {
      path: '/smart',
      name: 'smart',
      component: SmartCommand,
    },
  ],
});
