<template>
  <div class="view-wrapper p-4">
    <div class="transition-wrapper">
      <transition :name="transitionName">
        <router-view class="view" />
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.view-wrapper,
.transition-wrapper,
.view {
  width: 100%;
  height: 100%;
}

.transition-wrapper {
  position: relative;
}
</style>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';

@Component
export default class App extends Vue {
  transitionName = 'app-slide-next';

  @Watch('$route')
  onRouteChanged(to: Route, from: Route) {
    const depth = (route: Route) =>
      route.path.split('/').filter(p => !!p).length;

    this.transitionName =
      depth(to) < depth(from) ? 'app-slide-next' : 'app-slide-prev';
  }
}
</script>
