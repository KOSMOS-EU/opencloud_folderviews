<template>
  <pre class="text-viewer">{{ content }}</pre>
</template>

<script setup lang="ts">
defineProps<{ content: string }>()
</script>

<style scoped>
.text-viewer {
  margin: 0;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
  max-height: 400px;
  background: var(--oc-role-surface, #fafafa);
  border-radius: 4px;
}
</style>
