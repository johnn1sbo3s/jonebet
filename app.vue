<template>
	<div class="flex h-full gap-2">
		<div class="w-1/6 h-full">
			<UVerticalNavigation
				class="fixed w-1/6 px-2 h-full pt-2 bg-slate-50 dark:bg-gray-900"
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
		<div class="w-4/5">
			<NuxtLoadingIndicator color="linear-gradient(to right, #25D88B, #1E9EF4)"/>
			<NuxtPage class="p-6" />
		</div>
	</div>
</template>

<script setup>

useHead({
	title: "DataPlay",
})

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
			to: "/dashboard",
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
			label: "Performance",
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

onMounted(() => {
	window._mfq = window._mfq || [];
	(function() {
		var mf = document.createElement("script");
		mf.type = "text/javascript"; mf.defer = true;
		mf.src = "//cdn.mouseflow.com/projects/5385053f-80d7-4871-bb21-d736a7e91ba4.js";
		document.getElementsByTagName("head")[0].appendChild(mf);
	})();
})
</script>

<style>
div {
	font-family: satoshi, sans-serif;
}
</style>