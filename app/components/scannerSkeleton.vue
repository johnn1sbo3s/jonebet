<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
    <USkeleton v-for="i in 6" :key="i" class="h-72 rounded-2xl" />
  </div>
</template>

<script setup></script>
