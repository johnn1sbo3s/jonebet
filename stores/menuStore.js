import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useMenuStore = defineStore('menu', () => {
    const menuState = ref(false);

    const getMenuState = computed(() => menuState.value);

    function setMenuState(value) {
        menuState.value = value;
    }

    return { getMenuState, setMenuState };
});