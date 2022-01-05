import Vue from 'vue';
import VueRouter from 'vue-router';

import ActivatePage from './views/activate-page.vue';
import ConsolidateCommand from './views/consolidate-command.vue';
import HomePage from './views/home-page.vue';
import RelocateCommand from './views/relocate-command.vue';
import SettingsPage from './views/settings-page.vue';
import SmartCommand from './views/smart/smart-command.vue';

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
      path: '/activate',
      name: 'activate',
      component: ActivatePage,
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
    {
      path: '/relocate',
      name: 'relocate',
      component: RelocateCommand,
    },
    {
      path: '/consolidate',
      name: 'consolidate',
      component: ConsolidateCommand,
    },
  ],
});
