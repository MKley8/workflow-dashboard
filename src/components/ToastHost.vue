<script setup lang="ts">
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()
</script>

<template>
  <Transition name="fade">
    <div v-if="toastStore.visible" class="toast" role="status">{{ toastStore.message }}</div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1c212b;
  color: #f5f6fa;
  padding: 0.6rem 1.1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  z-index: 200;
  max-width: 90vw;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
