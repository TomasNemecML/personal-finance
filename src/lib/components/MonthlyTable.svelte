<script>
	import MonthDetailsModal from "./MonthDetailsModal.svelte";

	export let data = [];

	let selectedMonth = null;

	function formatCurrency(amount) {
		const hasDecimals = amount % 1 !== 0;
		return new Intl.NumberFormat("sk-SK", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: hasDecimals ? 2 : 0,
			maximumFractionDigits: 2,
		}).format(amount);
	}

	function getDifferenceColor(diff) {
		if (diff > 0) return "text-green-600";
		if (diff < 0) return "text-red-600";
		return "text-gray-600";
	}

	function openMonthDetails(month) {
		selectedMonth = month;
	}

	function closeMonthDetails() {
		selectedMonth = null;
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
	<div class="px-6 py-4 border-b border-gray-200">
		<h2 class="text-xl font-semibold text-gray-900">Monthly Overview</h2>
		<p class="text-sm text-gray-600 mt-1">Track your finances month by month</p>
	</div>

	<div class="overflow-x-auto">
		<table class="min-w-full">
			<thead>
				<tr class="bg-gradient-to-r from-gray-50 to-gray-100">
					<!-- Month Column -->
					<th class="sticky left-0 z-10 bg-gray-100 px-4 py-3 text-left border-r-2 border-gray-300">
						<div class="text-xs font-semibold text-gray-700 uppercase tracking-wider">Month</div>
					</th>

					<!-- Cash Flow Section -->
					<th colspan="4" class="px-4 py-2 text-center border-b border-gray-200 bg-green-50">
						<div class="text-xs font-bold text-green-800 uppercase tracking-wider">Cash Flow</div>
					</th>

					<!-- Assets Section -->
					<th colspan="3" class="px-4 py-2 text-center border-b border-gray-200 bg-blue-50">
						<div class="text-xs font-bold text-blue-800 uppercase tracking-wider">Assets</div>
					</th>
				</tr>
				<tr class="bg-white border-b-2 border-gray-300">
					<th class="sticky left-0 z-10 bg-white px-4 py-3 border-r-2 border-gray-300"></th>

					<!-- Cash Flow Columns -->
					<th class="px-4 py-3 text-left bg-green-50/30">
						<div class="text-xs font-medium text-gray-600 uppercase">Income</div>
					</th>
					<th class="px-4 py-3 text-left bg-green-50/30">
						<div class="text-xs font-medium text-gray-600 uppercase">Expenses</div>
					</th>
					<th class="px-4 py-3 text-left bg-green-50/30">
						<div class="text-xs font-medium text-gray-600 uppercase">Loans</div>
					</th>
					<th class="px-4 py-3 text-left bg-green-50/30 border-r-2 border-gray-200">
						<div class="text-xs font-medium text-gray-600 uppercase">Net</div>
					</th>

					<!-- Assets Columns -->
					<th class="px-4 py-3 text-left bg-blue-50/30">
						<div class="text-xs font-medium text-gray-600 uppercase">Cash</div>
					</th>
					<th class="px-4 py-3 text-left bg-blue-50/30">
						<div class="text-xs font-medium text-gray-600 uppercase">Investments</div>
					</th>
					<th class="px-4 py-3 text-left bg-blue-50/30">
						<div class="text-xs font-medium text-gray-600 uppercase">Total Worth</div>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data as month, index (month.key)}
					{#if index > 0 && month.date.getFullYear() !== data[index - 1].date.getFullYear()}
						<!-- Year divider -->
						<tr class="bg-gradient-to-r from-indigo-600 to-blue-600">
							<td colspan="8" class="px-6 py-2 text-center">
								<span class="text-xl font-bold text-white tracking-wide">
									{month.date.getFullYear()}
								</span>
							</td>
						</tr>
					{/if}
					<tr
						class="hover:bg-blue-50/50 cursor-pointer transition-all duration-150 {month.isCurrentMonth
							? 'bg-yellow-50 border-l-4 border-yellow-400'
							: ''}"
						on:click={() => openMonthDetails(month)}
					>
						<!-- Month -->
						<td
							class="sticky left-0 z-10 bg-white px-4 py-4 border-r-2 border-gray-200 {month.isCurrentMonth
								? 'bg-yellow-50'
								: ''}"
						>
							<div class="flex items-center gap-2">
								<div class="flex flex-col">
									<span class="text-base font-bold text-gray-900">
										{month.date.toLocaleString("default", { month: "short" })}
									</span>
									<span class="text-xs text-gray-500">
										{month.date.getFullYear()}
									</span>
								</div>
								{#if month.isCurrentMonth}
									<span
										class="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full"
										>Now</span
									>
								{/if}
							</div>
						</td>

						<!-- Cash Flow Section -->
						<td class="px-4 py-4 bg-green-50/20">
							<div class="text-sm font-semibold text-green-700">
								+{formatCurrency(month.income)}
							</div>
						</td>
						<td class="px-4 py-4 bg-red-50/20">
							<div class="text-sm font-semibold text-red-700">
								-{formatCurrency(month.expenses)}
							</div>
						</td>
						<td
							class="px-4 py-4 bg-gray-50/20"
							title="Principals: +{formatCurrency(
								month.loanPrincipalsTaken || 0,
							)} (taken) -{formatCurrency(
								month.loanPrincipalsGiven || 0,
							)} (given) | Payouts: +{formatCurrency(
								month.loansReceived || 0,
							)} (received) -{formatCurrency(month.loansPaid || 0)} (paid)"
						>
							<div class="text-sm font-medium {month.netLoans >= 0 ? 'text-green-600' : 'text-red-600'}">
								{month.netLoans >= 0 ? "+" : ""}{formatCurrency(month.netLoans)}
							</div>
						</td>
						<td class="px-4 py-4 bg-gray-50/30 border-r-2 border-gray-200">
							<div class="text-sm font-bold {getDifferenceColor(month.difference)}">
								{#if month.difference > 0}
									+{formatCurrency(month.difference)}
								{:else if month.difference < 0}
									{formatCurrency(month.difference)}
								{:else}
									-
								{/if}
							</div>
						</td>

						<!-- Assets Section -->
						<td class="px-4 py-4 bg-blue-50/20">
							<div class="text-sm font-bold text-gray-900">
								{formatCurrency(month.total)}
							</div>
						</td>
						<td class="px-4 py-4 bg-purple-50/20">
							<div class="text-sm font-bold text-purple-700">
								{formatCurrency(month.investmentValue || 0)}
							</div>
						</td>
						<td class="px-4 py-4 bg-blue-100/40">
							<div class="text-base font-extrabold text-blue-800">
								{formatCurrency(month.totalWorth || 0)}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.length === 0}
		<div class="text-center py-8">
			<p class="text-gray-500">No data available</p>
		</div>
	{/if}
</div>

<!-- Month Details Modal -->
<MonthDetailsModal monthData={selectedMonth} onClose={closeMonthDetails} />
