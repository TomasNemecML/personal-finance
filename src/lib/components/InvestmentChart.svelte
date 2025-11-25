<script>
	import { onMount, afterUpdate, onDestroy } from "svelte";
	import Chart from "chart.js/auto";

	export let investments = [];
	export let portfolioAllocations = [];

	let chartCanvas;
	let chartInstance;
	let viewMode = "combined"; // 'combined' or 'individual'

	function calculateProjection() {
		const months = 120; // 10 years
		const labels = [];
		const today = new Date();

		// Generate labels starting from Now
		for (let i = 0; i <= months; i++) {
			const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
			const monthLabel =
				i === 0 ? "Now" : currentMonthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
			labels.push(monthLabel);
		}

		// Pre-calculate current values for all investments up to today (For Individual View)
		let currentInvestmentValues = new Map(); // Map<id, { value: number, contributed: number }>

		investments.forEach((inv) => {
			const entryDate = new Date(inv.date);
			const annualRate = parseFloat(inv.annualReturn) || 0;
			const monthlyRate = annualRate / 100 / 12;

			let currentValue = 0;
			let totalContributed = 0;

			// Calculate months passed since investment start until now
			const startYear = entryDate.getFullYear();
			const startMonth = entryDate.getMonth();
			const currentYear = today.getFullYear();
			const currentMonth = today.getMonth();

			const monthsDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth);

			if (monthsDiff >= 0) {
				// Iterate through past months to accumulate value
				for (let i = 0; i <= monthsDiff; i++) {
					let contribution = 0;

					if (inv.type === "one-time") {
						// One-time contribution happens only at month 0 (start date)
						if (i === 0) contribution = parseFloat(inv.amount);
					} else if (inv.type === "monthly") {
						// Monthly contribution happens every month
						contribution = parseFloat(inv.amount);
					}

					// Apply growth to existing pot
					currentValue = currentValue * (1 + monthlyRate);
					// Add new contribution
					currentValue += contribution;
					totalContributed += contribution;
				}
			}

			currentInvestmentValues.set(inv.id, { value: currentValue, contributed: totalContributed });
		});

		if (viewMode === "combined") {
			const investedData = [];
			const valueData = [];

			// Combined View Logic:
			// Start from portfolio allocations (initial investments with growth).
			// Track future contributions from regular investments.

			// Initialize portfolio values
			let portfolioValues = new Map();
			let totalPortfolioInvested = 0;

			portfolioAllocations.forEach((allocation) => {
				portfolioValues.set(allocation.id, allocation.amount);
				totalPortfolioInvested += allocation.amount;
			});

			let cumulativeInvested = totalPortfolioInvested;
			let investmentValues = new Map(); // Starts empty for future growth tracking

			// Calculate initial total value (portfolio allocations at current value)
			let initialPortfolioValue = portfolioAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);

			// Push initial state (Now)
			investedData.push(cumulativeInvested);
			valueData.push(initialPortfolioValue);

			// Project into future (starting from month 1)
			for (let i = 1; i <= months; i++) {
				const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);

				let monthContribution = 0;

				// Apply growth to portfolio allocations
				portfolioAllocations.forEach((allocation) => {
					const annualRate = parseFloat(allocation.annualReturn) || 0;
					const monthlyRate = annualRate / 100 / 12;

					let currentValue = portfolioValues.get(allocation.id) || 0;
					currentValue = currentValue * (1 + monthlyRate);
					portfolioValues.set(allocation.id, currentValue);
				});

				// Process regular investments
				investments.forEach((inv) => {
					const annualRate = parseFloat(inv.annualReturn) || 0;
					const monthlyRate = annualRate / 100 / 12;
					let contribution = 0;

					const entryDate = new Date(inv.date);
					const startMonthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;
					const projectionMonthKey = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, "0")}`;

					if (inv.type === "one-time") {
						// Only add if it happens in this future month
						if (startMonthKey === projectionMonthKey) {
							contribution = parseFloat(inv.amount);
						}
					} else if (inv.type === "monthly") {
						// Only add if start date is reached
						const currentVal = currentMonthDate.getFullYear() * 12 + currentMonthDate.getMonth();
						const startVal = entryDate.getFullYear() * 12 + entryDate.getMonth();

						if (currentVal >= startVal) {
							contribution = parseFloat(inv.amount);
						}
					}

					monthContribution += contribution;

					let currentValue = investmentValues.get(inv.id) || 0;

					// Apply growth
					currentValue = currentValue * (1 + monthlyRate);
					// Add contribution
					currentValue += contribution;

					investmentValues.set(inv.id, currentValue);
				});

				cumulativeInvested += monthContribution;

				// Total Value = Portfolio Allocations (Growing) + Regular Investments (Growing)
				const totalPortfolioValue = Array.from(portfolioValues.values()).reduce((sum, val) => sum + val, 0);
				const totalInvestmentValue = Array.from(investmentValues.values()).reduce((sum, val) => sum + val, 0);
				const totalValue = totalPortfolioValue + totalInvestmentValue;

				investedData.push(cumulativeInvested);
				valueData.push(totalValue);
			}

			return {
				labels,
				datasets: [
					{
						label: "Portfolio Value",
						data: valueData,
						borderColor: "#22c55e",
						backgroundColor: (context) => {
							const ctx = context.chart.ctx;
							const gradient = ctx.createLinearGradient(0, 0, 0, 400);
							gradient.addColorStop(0, "rgba(34, 197, 94, 0.2)");
							gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
							return gradient;
						},
						borderWidth: 3,
						fill: true,
						tension: 0.4,
						pointRadius: 0,
						pointHoverRadius: 6,
						pointHoverBackgroundColor: "#22c55e",
						pointHoverBorderColor: "#ffffff",
						pointHoverBorderWidth: 2,
					},
					{
						label: "Total Invested",
						data: investedData,
						borderColor: "#9ca3af",
						backgroundColor: "transparent",
						borderWidth: 2,
						borderDash: [5, 5],
						fill: false,
						tension: 0.4,
						pointRadius: 0,
						pointHoverRadius: 0,
					},
				],
			};
		} else {
			// Individual View
			const datasets = [];
			const colors = [
				"#3b82f6", // blue
				"#ef4444", // red
				"#f59e0b", // amber
				"#8b5cf6", // violet
				"#ec4899", // pink
				"#10b981", // emerald
				"#6366f1", // indigo
				"#f97316", // orange
			];

			investments.forEach((inv, index) => {
				const data = [];
				const color = colors[index % colors.length];

				// Individual View Logic:
				// Start from the PRE-CALCULATED current value (includes past history).
				// Project future growth and contributions.

				const preCalculated = currentInvestmentValues.get(inv.id) || { value: 0, contributed: 0 };
				let currentValue = preCalculated.value;

				const entryDate = new Date(inv.date);
				const annualRate = parseFloat(inv.annualReturn) || 0;
				const monthlyRate = annualRate / 100 / 12;

				// Push initial value (Now)
				data.push(currentValue);

				// Project future
				for (let i = 1; i <= months; i++) {
					const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
					let contribution = 0;

					const startMonthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;
					const projectionMonthKey = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, "0")}`;

					if (inv.type === "one-time") {
						if (startMonthKey === projectionMonthKey) {
							contribution = parseFloat(inv.amount);
						}
					} else if (inv.type === "monthly") {
						const currentVal = currentMonthDate.getFullYear() * 12 + currentMonthDate.getMonth();
						const startVal = entryDate.getFullYear() * 12 + entryDate.getMonth();
						if (currentVal >= startVal) {
							contribution = parseFloat(inv.amount);
						}
					}

					currentValue = currentValue * (1 + monthlyRate);
					currentValue += contribution;
					data.push(currentValue);
				}

				datasets.push({
					label: inv.description || "Investment " + (index + 1),
					data: data,
					borderColor: color,
					backgroundColor: "transparent",
					borderWidth: 2,
					tension: 0.4,
					pointRadius: 0,
					pointHoverRadius: 6,
					pointHoverBackgroundColor: color,
					pointHoverBorderColor: "#ffffff",
					pointHoverBorderWidth: 2,
				});
			});

			return { labels, datasets };
		}
	}

	function updateChart() {
		if (!chartCanvas) return;

		const { labels, datasets } = calculateProjection();

		if (chartInstance) {
			chartInstance.data.labels = labels;
			chartInstance.data.datasets = datasets;
			chartInstance.update();
		} else {
			chartInstance = new Chart(chartCanvas, {
				type: "line",
				data: {
					labels: labels,
					datasets: datasets,
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: "index",
						intersect: false,
					},
					plugins: {
						tooltip: {
							backgroundColor: "rgba(255, 255, 255, 0.9)",
							titleColor: "#1f2937",
							bodyColor: "#4b5563",
							borderColor: "#e5e7eb",
							borderWidth: 1,
							padding: 12,
							displayColors: true,
							boxWidth: 8,
							boxHeight: 8,
							usePointStyle: true,
							callbacks: {
								label: function (context) {
									let label = context.dataset.label || "";
									if (label) {
										label += ": ";
									}
									if (context.parsed.y !== null) {
										label += new Intl.NumberFormat("en-US", {
											style: "currency",
											currency: "EUR",
										}).format(context.parsed.y);
									}
									return label;
								},
							},
						},
						legend: {
							display: true,
							position: "top",
							align: "end",
							labels: {
								usePointStyle: true,
								boxWidth: 8,
								font: {
									size: 12,
									family: "'Inter', sans-serif",
								},
								color: "#6b7280",
							},
						},
						title: {
							display: false,
						},
					},
					scales: {
						x: {
							grid: {
								display: false,
								drawBorder: false,
							},
							ticks: {
								color: "#9ca3af",
								font: {
									size: 11,
								},
								maxTicksLimit: 6,
							},
						},
						y: {
							position: "right",
							grid: {
								color: "#f3f4f6",
								drawBorder: false,
							},
							ticks: {
								color: "#9ca3af",
								font: {
									size: 11,
								},
								callback: function (value) {
									return new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: "EUR",
										notation: "compact",
									}).format(value);
								},
							},
						},
					},
				},
			});
		}
	}

	onMount(() => {
		updateChart();
	});

	afterUpdate(() => {
		updateChart();
	});

	// Cleanup on destroy
	// Cleanup on destroy
	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
	});
</script>

<div class="bg-white p-4 rounded-lg border border-gray-200 mb-6">
	<div class="flex justify-between items-center mb-4">
		<h3 class="text-lg font-semibold text-gray-900">Projection</h3>
		<div class="flex bg-gray-100 rounded-lg p-1">
			<button
				class="px-3 py-1 text-sm font-medium rounded-md transition-colors {viewMode === 'combined'
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-500 hover:text-gray-900'}"
				on:click={() => {
					viewMode = "combined";
					updateChart();
				}}
			>
				Combined
			</button>
			<button
				class="px-3 py-1 text-sm font-medium rounded-md transition-colors {viewMode === 'individual'
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-500 hover:text-gray-900'}"
				on:click={() => {
					viewMode = "individual";
					updateChart();
				}}
			>
				Individual
			</button>
		</div>
	</div>
	<div class="w-full h-[400px]">
		<canvas bind:this={chartCanvas}></canvas>
	</div>
</div>
