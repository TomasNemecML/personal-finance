<script>
	import {
		incomeEntries,
		expenseEntries,
		loansGiven,
		loansTaken,
		investmentEntries,
		realizedEntries,
		financeActions,
		getMonthDetails,
		monthlyData,
	} from "$lib/stores.js";

	export let monthData = null;
	export let onClose = () => {};

	function formatCurrency(amount) {
		const hasDecimals = amount % 1 !== 0;
		return new Intl.NumberFormat("sk-SK", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: hasDecimals ? 2 : 0,
			maximumFractionDigits: 2,
		}).format(amount);
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	$: details = monthData
		? getMonthDetails(monthData.key, $incomeEntries, $expenseEntries, $loansGiven, $loansTaken, $investmentEntries)
		: null;

	$: isCurrentMonth = monthData?.isCurrentMonth;
	$: isRealized = (id) => $realizedEntries.includes(`${id}_${monthData.key}`);

	// Get previous month's investment value for accurate growth calculation
	$: previousMonthInvestmentValue = monthData
		? (() => {
				const currentMonthIndex = $monthlyData.findIndex((m) => m.key === monthData.key);
				if (currentMonthIndex > 0) {
					return $monthlyData[currentMonthIndex - 1].investmentValue || 0;
				}
				return 0;
			})()
		: 0;

	// Calculate interest earned this month
	$: interestEarned = (monthData?.investmentValue || 0) - previousMonthInvestmentValue - (monthData?.invested || 0);
</script>

{#if monthData}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
		on:click={handleBackdropClick}
	>
		<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
			<!-- Header -->
			<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
				<div>
					<h2 class="text-2xl font-bold text-gray-900">{monthData.label}</h2>
					<p class="text-sm text-gray-600 mt-1">All financial activities for this month</p>
				</div>
				<button
					class="text-gray-400 hover:text-gray-600 text-2xl font-bold"
					on:click={onClose}
					aria-label="Close"
				>
					×
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto min-h-0">
				<div class="px-6 py-4">
					<!-- Summary Cards -->
					<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
						<div class="bg-blue-50 rounded-lg p-4">
							<p class="text-sm text-blue-600 font-medium">Total Money</p>
							<p class="text-xl font-bold text-blue-900">{formatCurrency(monthData.total)}</p>
						</div>
						<div class="bg-green-50 rounded-lg p-4">
							<p class="text-sm text-green-600 font-medium">Income</p>
							<p class="text-xl font-bold text-green-900">{formatCurrency(monthData.income)}</p>
						</div>
						<div class="bg-red-50 rounded-lg p-4">
							<p class="text-sm text-red-600 font-medium">Expenses</p>
							<p class="text-xl font-bold text-red-900">{formatCurrency(monthData.expenses)}</p>
						</div>
						<div class="bg-purple-50 rounded-lg p-4">
							<p class="text-sm text-purple-600 font-medium">Invested</p>
							<p class="text-xl font-bold text-purple-900">{formatCurrency(monthData.invested || 0)}</p>
							<p class="text-xs text-purple-700 mt-1">
								Value: {formatCurrency(monthData.investmentValue || 0)}
							</p>
						</div>
						<div class="bg-orange-50 rounded-lg p-4">
							<p class="text-sm text-orange-600 font-medium">Net Loans</p>
							<p class="text-xl font-bold {monthData.netLoans >= 0 ? 'text-orange-900' : 'text-red-900'}">
								{formatCurrency(monthData.netLoans)}
							</p>
							<div class="text-xs text-purple-700 mt-1 space-y-0.5">
								{#if (monthData.loanPrincipalsTaken || 0) > 0}
									<div class="flex justify-between">
										<span>Loans taken:</span>
										<span class="font-medium">+{formatCurrency(monthData.loanPrincipalsTaken)}</span
										>
									</div>
								{/if}
								{#if (monthData.loanPrincipalsGiven || 0) > 0}
									<div class="flex justify-between">
										<span>Loans given:</span>
										<span class="font-medium">-{formatCurrency(monthData.loanPrincipalsGiven)}</span
										>
									</div>
								{/if}
								{#if (monthData.loansReceived || 0) > 0}
									<div class="flex justify-between">
										<span>Received back:</span>
										<span class="font-medium">+{formatCurrency(monthData.loansReceived)}</span>
									</div>
								{/if}
								{#if (monthData.loansPaid || 0) > 0}
									<div class="flex justify-between">
										<span>Paid back:</span>
										<span class="font-medium">-{formatCurrency(monthData.loansPaid)}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Income Section -->
					{#if details && details.income.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
								<span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
								Income ({details.income.length})
							</h3>
							<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											{#if isCurrentMonth}
												<th
													class="w-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Realized
												</th>
											{/if}
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Type
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Description
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Date
											</th>
											<th
												class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Amount
											</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each details.income as entry (entry.id)}
											<tr
												class={isCurrentMonth && isRealized(entry.id)
													? "bg-gray-50 opacity-60"
													: "hover:bg-gray-50"}
											>
												{#if isCurrentMonth}
													<td class="px-4 py-3 text-sm">
														<input
															type="checkbox"
															checked={isRealized(entry.id)}
															on:change={() =>
																financeActions.toggleRealized(entry.id, monthData.key)}
															class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
															title="Mark as realized (already in bank balance)"
														/>
													</td>
												{/if}
												<td class="px-4 py-3 text-sm">
													<span
														class="px-2 py-1 text-xs rounded-full {(entry.type ||
															'one-time') === 'monthly'
															? 'bg-blue-100 text-blue-800'
															: 'bg-gray-100 text-gray-800'}"
													>
														{(entry.type || "one-time") === "monthly"
															? "Monthly"
															: "One-Time"}
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-gray-900">
													<span
														class={isCurrentMonth && isRealized(entry.id)
															? "line-through text-gray-500"
															: ""}
													>
														{entry.description || "-"}
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-gray-600">
													{formatDate(entry.date)}
													{#if (entry.type || "one-time") === "monthly"}
														<span class="text-xs text-gray-500">(Start)</span>
													{/if}
												</td>
												<td class="px-4 py-3 text-sm text-right font-semibold text-green-600">
													<span
														class={isCurrentMonth && isRealized(entry.id)
															? "line-through text-gray-400"
															: ""}
													>
														{formatCurrency(entry.amount)}
													</span>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- Expenses Section -->
					{#if details && details.expenses.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
								<span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
								Expenses ({details.expenses.length})
							</h3>
							<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											{#if isCurrentMonth}
												<th
													class="w-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Realized
												</th>
											{/if}
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Type
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Description
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Date
											</th>
											<th
												class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Amount
											</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each details.expenses as entry (entry.id)}
											<tr
												class={isCurrentMonth && isRealized(entry.id)
													? "bg-gray-50 opacity-60"
													: "hover:bg-gray-50"}
											>
												{#if isCurrentMonth}
													<td class="px-4 py-3 text-sm">
														<input
															type="checkbox"
															checked={isRealized(entry.id)}
															on:change={() =>
																financeActions.toggleRealized(entry.id, monthData.key)}
															class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
															title="Mark as realized (already paid)"
														/>
													</td>
												{/if}
												<td class="px-4 py-3 text-sm">
													<span
														class="px-2 py-1 text-xs rounded-full {(entry.type ||
															'one-time') === 'monthly'
															? 'bg-blue-100 text-blue-800'
															: 'bg-gray-100 text-gray-800'}"
													>
														{(entry.type || "one-time") === "monthly"
															? "Monthly"
															: "One-Time"}
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-gray-900">
													<span
														class={isCurrentMonth && isRealized(entry.id)
															? "line-through text-gray-500"
															: ""}
													>
														{entry.description || "-"}
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-gray-600">
													{formatDate(entry.date)}
													{#if (entry.type || "one-time") === "monthly"}
														<span class="text-xs text-gray-500">(Start)</span>
													{/if}
												</td>
												<td class="px-4 py-3 text-sm text-right font-semibold text-red-600">
													<span
														class={isCurrentMonth && isRealized(entry.id)
															? "line-through text-gray-400"
															: ""}
													>
														{formatCurrency(entry.amount)}
													</span>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- Investments Section -->
					{#if details && details.investments && details.investments.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
								<span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
								Investment Growth Breakdown
							</h3>

							<!-- Investment Summary Card -->
							<div
								class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 mb-4 border border-purple-200"
							>
								<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p class="text-xs text-purple-600 font-medium mb-1">Previous Month</p>
										<p class="text-lg font-bold text-gray-900">
											{formatCurrency(previousMonthInvestmentValue)}
										</p>
									</div>
									<div>
										<p class="text-xs text-blue-600 font-medium mb-1">Invested This Month</p>
										<p class="text-lg font-bold text-blue-700">
											+{formatCurrency(monthData.invested || 0)}
										</p>
									</div>
									<div>
										<p class="text-xs text-green-600 font-medium mb-1">Interest Earned</p>
										<p class="text-lg font-bold text-green-700">
											+{formatCurrency(interestEarned)}
										</p>
									</div>
									<div class="bg-white/60 rounded-lg p-3 -m-3">
										<p class="text-xs text-purple-700 font-medium mb-1">End of Month</p>
										<p class="text-xl font-extrabold text-purple-900">
											{formatCurrency(monthData.investmentValue || 0)}
										</p>
									</div>
								</div>
							</div>

							<!-- Individual Investments Table -->
							<h4 class="text-sm font-semibold text-gray-700 mb-2">Contributions This Month</h4>
							<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											{#if isCurrentMonth}
												<th
													class="w-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Realized
												</th>
											{/if}
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Type
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Description
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Date
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Return Rate
											</th>
											<th
												class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Amount
											</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each details.investments as entry (entry.id)}
											<tr
												class={isCurrentMonth && isRealized(entry.id)
													? "bg-gray-50 opacity-60"
													: "hover:bg-gray-50"}
											>
												{#if isCurrentMonth}
													<td class="px-4 py-3 text-sm">
														<input
															type="checkbox"
															checked={isRealized(entry.id)}
															on:change={() =>
																financeActions.toggleRealized(entry.id, monthData.key)}
															class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
															title="Mark as realized (already invested)"
														/>
													</td>
												{/if}
												<td class="px-4 py-3 text-sm">
													<span
														class="px-2 py-1 text-xs rounded-full {(entry.type ||
															'one-time') === 'monthly'
															? 'bg-blue-100 text-blue-800'
															: 'bg-gray-100 text-gray-800'}"
													>
														{(entry.type || "one-time") === "monthly"
															? "Monthly"
															: "One-Time"}
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-gray-900">
													<span
														class={isCurrentMonth && isRealized(entry.id)
															? "line-through text-gray-500"
															: ""}
													>
														{entry.description || "-"}
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-gray-600">
													{formatDate(entry.date)}
													{#if (entry.type || "one-time") === "monthly"}
														<span class="text-xs text-gray-500">(Start)</span>
													{/if}
												</td>
												<td class="px-4 py-3 text-sm text-gray-600">
													<span class="font-medium text-green-600">
														{entry.annualReturn || 0}% p.a.
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-right font-semibold text-purple-600">
													<span
														class={isCurrentMonth && isRealized(entry.id)
															? "line-through text-gray-400"
															: ""}
													>
														{formatCurrency(entry.amount)}
													</span>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- Loans Given Section -->
					{#if details && details.loansGiven.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
								<span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
								Loans Given ({details.loansGiven.length})
							</h3>
							<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											{#if isCurrentMonth}
												<th
													class="w-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Realized
												</th>
											{/if}
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Description
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Mode
											</th>
											<th
												class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Amount
											</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each details.loansGiven as loan (loan.id)}
											<tr
												class={isCurrentMonth && isRealized(loan.id)
													? "bg-gray-50 opacity-60"
													: "hover:bg-gray-50"}
											>
												{#if isCurrentMonth}
													<td class="px-4 py-3 text-sm">
														<input
															type="checkbox"
															checked={isRealized(loan.id)}
															on:change={() =>
																financeActions.toggleRealized(loan.id, monthData.key)}
															class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
															title="Mark as realized"
														/>
													</td>
												{/if}
												<td class="px-4 py-3 text-sm text-gray-900">
													<span
														class={isCurrentMonth && isRealized(loan.id)
															? "line-through text-gray-500"
															: ""}
													>
														{loan.description || "Untitled Loan"}
													</span>
													{#if loan.isPrincipalMonth}
														<span
															class="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800"
														>
															Principal
														</span>
													{/if}
												</td>
												<td class="px-4 py-3 text-sm">
													<span
														class="px-2 py-1 text-xs rounded-full {loan.mode === 'monthly'
															? 'bg-blue-100 text-blue-800'
															: 'bg-purple-100 text-purple-800'}"
													>
														{loan.mode === "monthly" ? "Monthly" : "Manual"}
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-right">
													<div
														class={isCurrentMonth && isRealized(loan.id)
															? "line-through opacity-50"
															: ""}
													>
														{#if loan.isPrincipalMonth}
															<div class="font-semibold text-red-600">
																-{formatCurrency(
																	Number(loan.principalAmount || loan.totalSum) || 0,
																)}
																<span class="text-xs text-gray-500">(given)</span>
															</div>
														{/if}
														{#if loan.mode === "monthly" && !loan.isPrincipalMonth}
															<div class="font-semibold text-green-600">
																+{formatCurrency(Number(loan.monthlyPayout) || 0)}
																<span class="text-xs text-gray-500">(payout)</span>
															</div>
														{:else if loan.mode === "manual" && !loan.isPrincipalMonth}
															<div class="font-semibold text-green-600">
																+{formatCurrency(
																	loan.payouts
																		?.filter(
																			(p) =>
																				new Date(p.date).getFullYear() ===
																					new Date(
																						monthData.key,
																					).getFullYear() &&
																				new Date(p.date).getMonth() ===
																					new Date(monthData.key).getMonth(),
																		)
																		.reduce(
																			(sum, p) => sum + Number(p.amount || 0),
																			0,
																		) || 0,
																)}
																<span class="text-xs text-gray-500">(payout)</span>
															</div>
														{/if}
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- Loans Taken Section -->
					{#if details && details.loansTaken.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
								<span class="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
								Loans Taken ({details.loansTaken.length})
							</h3>
							<div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											{#if isCurrentMonth}
												<th
													class="w-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Realized
												</th>
											{/if}
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Description
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Mode
											</th>
											<th
												class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Amount
											</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each details.loansTaken as loan (loan.id)}
											<tr
												class={isCurrentMonth && isRealized(loan.id)
													? "bg-gray-50 opacity-60"
													: "hover:bg-gray-50"}
											>
												{#if isCurrentMonth}
													<td class="px-4 py-3 text-sm">
														<input
															type="checkbox"
															checked={isRealized(loan.id)}
															on:change={() =>
																financeActions.toggleRealized(loan.id, monthData.key)}
															class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
															title="Mark as realized"
														/>
													</td>
												{/if}
												<td class="px-4 py-3 text-sm text-gray-900">
													<span
														class={isCurrentMonth && isRealized(loan.id)
															? "line-through text-gray-500"
															: ""}
													>
														{loan.description || "Untitled Loan"}
													</span>
													{#if loan.isPrincipalMonth}
														<span
															class="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800"
														>
															Principal
														</span>
													{/if}
												</td>
												<td class="px-4 py-3 text-sm">
													<span
														class="px-2 py-1 text-xs rounded-full {loan.mode === 'monthly'
															? 'bg-blue-100 text-blue-800'
															: 'bg-purple-100 text-purple-800'}"
													>
														{loan.mode === "monthly" ? "Monthly" : "Manual"}
													</span>
												</td>
												<td class="px-4 py-3 text-sm text-right">
													<div
														class={isCurrentMonth && isRealized(loan.id)
															? "line-through opacity-50"
															: ""}
													>
														{#if loan.isPrincipalMonth}
															<div class="font-semibold text-green-600">
																+{formatCurrency(
																	Number(loan.principalAmount || loan.totalSum) || 0,
																)}
																<span class="text-xs text-gray-500">(received)</span>
															</div>
														{/if}
														{#if loan.mode === "monthly" && !loan.isPrincipalMonth}
															<div class="font-semibold text-red-600">
																-{formatCurrency(Number(loan.monthlyPayout) || 0)}
																<span class="text-xs text-gray-500">(payment)</span>
															</div>
														{:else if loan.mode === "manual" && !loan.isPrincipalMonth}
															<div class="font-semibold text-red-600">
																-{formatCurrency(
																	loan.payouts
																		?.filter(
																			(p) =>
																				new Date(p.date).getFullYear() ===
																					new Date(
																						monthData.key,
																					).getFullYear() &&
																				new Date(p.date).getMonth() ===
																					new Date(monthData.key).getMonth(),
																		)
																		.reduce(
																			(sum, p) => sum + Number(p.amount || 0),
																			0,
																		) || 0,
																)}
																<span class="text-xs text-gray-500">(payment)</span>
															</div>
														{/if}
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					<!-- Empty State -->
					{#if details && details.income.length === 0 && details.expenses.length === 0 && details.loansGiven.length === 0 && details.loansTaken.length === 0}
						<div class="text-center py-12">
							<p class="text-gray-500 text-lg">No financial activities recorded for this month</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
				<button
					class="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
					on:click={onClose}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
