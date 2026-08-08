<template>
  <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
    <USkeleton v-for="i in 6" :key="i" class="h-[25.5rem] rounded-2xl" />
  </div>
</template>

<script setup></script>
