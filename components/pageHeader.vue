<template>
	<div class="flex gap-5">
		<div class="flex gap-3 items-center">
			<div
				class="sm:hidden flex items-center justify-center cursor-pointer"
				@click="toggleMenu"
			>
				<UIcon
					name="i-heroicons-bars-3"
					class="w-6 h-6 self-center"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<h1 class="text-xl sm:text-2xl font-semibold align-middle">{{ title }}</h1>

				<div
					v-if="description"
					class="text-sm text-slate-500"
				>
					{{ description }}
				</div>
			</div>
		</div>

		<slot name="right"></slot>
	</div>
</template>

<script setup>
const props = defineProps({
		title: {
				type: String,
				required: true,
		},
		description: {
				type: String,
				required: false,
				default: () => ''
		}
})

const emits = defineEmits(['menu-click']);

const menuStore = useMenuStore();

function toggleMenu() {
	menuStore.setMenuState(!menuStore.getMenuState);
}
</script>