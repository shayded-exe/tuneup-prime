import Vue from 'vue';
import VueRouter from 'vue-router';

import Home from './views/home.vue';

Vue.use(VueRouter);

export const router = new VueRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
  ],
});
