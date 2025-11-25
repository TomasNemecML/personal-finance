<script>
	import { onMount, afterUpdate, onDestroy } from "svelte";
	import Chart from "chart.js/auto";

	export let data;
	export let title;

	let canvas;
	let chart;

	function updateChart() {
		if (!canvas) return;
		if (chart) chart.destroy();

		chart = new Chart(canvas, {
			type: "pie",
			data: data,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: "bottom",
						labels: {
							boxWidth: 10,
							font: { size: 10, family: "'Inter', sans-serif" },
							color: "#4b5563",
						},
					},
					title: {
						display: !!title,
						text: title,
						font: { size: 14, weight: "bold", family: "'Inter', sans-serif" },
						color: "#1f2937",
						padding: { bottom: 10 },
					},
				},
			},
		});
	}

	onMount(updateChart);
	afterUpdate(updateChart);
	onDestroy(() => {
		if (chart) chart.destroy();
	});
</script>

<div class="w-full h-64 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
	<canvas bind:this={canvas}></canvas>
</div>
