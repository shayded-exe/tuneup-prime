<template>
  <div v-if="message" class="message is-danger">
    <div class="message-body">{{ message }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ErrorMessage extends Vue {
  @Prop(String) message?: string;
}
</script>
