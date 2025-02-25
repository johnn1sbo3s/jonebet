<template>
	<div class="h-full flex gap-2">
		<transition
			enter-active-class="transition-transform duration-300 ease-in-out"
			enter-from-class="-translate-x-full"
			enter-to-class="translate-x-0"
			leave-active-class="transition-transform duration-300 ease-in-out"
			leave-from-class="translate-x-0"
			leave-to-class="-translate-x-full"
		>
			<div
				v-if="showMenu"
				class="fixed inset-y-0 left-0 w-80 h-screen z-50"
			>
				<UVerticalNavigation
					class="h-full pt-2 bg-slate-50 dark:bg-gray-900"
					:links="links"
					:ui="{
						padding: 'p-4',
						gap: 'gap-2',
						avatar: 'w-5 h-5',
					}"
					@click="closeMenu"
				>
					<template #avatar> </template>
				</UVerticalNavigation>
			</div>
		</transition>

		<div class="hidden sm:block w-80 h-full">
			<UVerticalNavigation
				class="fixed px-2 h-full pt-2 bg-slate-50 dark:bg-gray-900"
				:links="links"
				:ui="{
				padding: 'p-4',
				gap: 'gap-2',
				avatar: 'w-5 h-5',
				}"
			>
				<template #avatar> </template>
			</UVerticalNavigation>
		</div>

		<div
			class="w-full transition-margin duration-300 ease-in-out"
			:class="{ 'ml-80': showMenu }"
		>
			<NuxtLoadingIndicator color="linear-gradient(to right, #25D88B, #1E9EF4)" />
			<NuxtPage class="p-6" />
		</div>
	</div>
</template>

<script setup>
import { init } from '@fullstory/browser';
const { isMobile } = useDevice();
const showAlert = ref(true);

if (process.client) {
	init({ orgId: 'o-22P180-na1' });
}

useHead({
	title: "DataPlay",
});

const menuState = useMenuStore();

const links = [
	[
	  {
		avatar: {
		  src: "/dataplay-icon.png",
		  srcset: "",
		  alt: "",
		},
		label: "DataPlay",
		to: "https://github.com/johnn1sbo3s",
		target: "_blank",
	  },
	],
	[
	  {
		label: "Dashboard",
		icon: "i-heroicons-squares-2x2",
		to: "/",
	  },
	  {
		label: "Jogos do Dia",
		icon: "i-heroicons-calendar-days",
		to: "/fixtures",
	  },
	  {
		label: "Apostas do Dia",
		icon: "i-heroicons-clipboard-document-list",
		to: "/daily-bets",
	  },
	  {
		label: "Performance dos modelos",
		icon: "i-heroicons-chart-bar",
		to: "/performance",
	  },
	  {
		label: "Monitoramento em Lotes",
		icon: "i-heroicons-inbox-stack",
		to: "/batch-monitoring",
	  },
	  {
		label: "Alavancagem",
		icon: "i-heroicons-arrow-trending-up",
		to: "/leverage-bets",
	  },
	{
		label: "Comparador",
		icon: "i-heroicons-chart-pie",
		to: "/comparison",
	  },
	],
];

const showMenu = computed(() => menuState.getMenuState);

function closeMenu() {
	menuState.setMenuState(false);
}
</script>

<style>
div {
	font-family: satoshi, sans-serif;
}

</style>