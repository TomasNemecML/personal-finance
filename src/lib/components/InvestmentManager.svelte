<script>
	import { investmentEntries, financeActions, portfolioAllocations } from "$lib/stores.js";
	import InvestmentChart from "./InvestmentChart.svelte";

	let showAddForm = false;
	let newInvestment = {
		amount: "",
		description: "",
		date: new Date().toISOString().split("T")[0],
		type: "one-time",
		annualReturn: 0,
	};
	let editingInvestment = null;

	// Portfolio allocation state
	let showAddAllocationForm = false;
	let newAllocation = {
		amount: "",
		description: "",
		annualReturn: 0,
	};
	let editingAllocation = null;

	function formatCurrency(amount) {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "EUR",
		}).format(amount);
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	function addInvestment() {
		if (!newInvestment.amount || newInvestment.amount <= 0) return;

		financeActions.addInvestment(
			parseFloat(newInvestment.amount),
			newInvestment.description,
			new Date(newInvestment.date),
			newInvestment.type,
			parseFloat(newInvestment.annualReturn) || 0,
		);

		// Reset form
		newInvestment = {
			amount: "",
			description: "",
			date: new Date().toISOString().split("T")[0],
			type: "one-time",
			annualReturn: 0,
		};
		showAddForm = false;
	}

	function startEditing(investment) {
		editingInvestment = { ...investment, type: investment.type || "one-time" };
	}

	function saveEdit() {
		if (!editingInvestment.amount || editingInvestment.amount <= 0) return;

		financeActions.updateInvestment(editingInvestment.id, {
			amount: parseFloat(editingInvestment.amount),
			description: editingInvestment.description,
			date: editingInvestment.date,
			type: editingInvestment.type,
			annualReturn: parseFloat(editingInvestment.annualReturn) || 0,
		});

		editingInvestment = null;
	}

	function cancelEdit() {
		editingInvestment = null;
	}

	function deleteInvestment(id) {
		if (confirm("Are you sure you want to delete this investment entry?")) {
			financeActions.deleteInvestment(id);
		}
	}

	// Portfolio allocation functions
	function addAllocation() {
		if (!newAllocation.amount || newAllocation.amount <= 0) return;

		financeActions.addPortfolioAllocation(
			parseFloat(newAllocation.amount),
			newAllocation.description,
			parseFloat(newAllocation.annualReturn) || 0,
		);

		// Reset form
		newAllocation = {
			amount: "",
			description: "",
			annualReturn: 0,
		};
		showAddAllocationForm = false;
	}

	function startEditingAllocation(allocation) {
		editingAllocation = { ...allocation };
	}

	function saveAllocationEdit() {
		if (!editingAllocation.amount || editingAllocation.amount <= 0) return;

		financeActions.updatePortfolioAllocation(editingAllocation.id, {
			amount: parseFloat(editingAllocation.amount),
			description: editingAllocation.description,
			annualReturn: parseFloat(editingAllocation.annualReturn) || 0,
		});

		editingAllocation = null;
	}

	function cancelAllocationEdit() {
		editingAllocation = null;
	}

	function deleteAllocation(id) {
		if (confirm("Are you sure you want to delete this portfolio allocation?")) {
			financeActions.deletePortfolioAllocation(id);
		}
	}

	// Calculate total portfolio value
	$: totalPortfolioValue = $portfolioAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);

	// Separate and sort investments
	$: monthlyInvestments = $investmentEntries.filter((inv) => (inv.type || "one-time") === "monthly");
	$: oneTimeInvestments = $investmentEntries
		.filter((inv) => (inv.type || "one-time") === "one-time")
		.sort((a, b) => new Date(a.date) - new Date(b.date));
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
	<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
		<div>
			<h2 class="text-xl font-semibold text-gray-900">Investment Management</h2>
			<p class="text-sm text-gray-600 mt-1">Track your investments and growth</p>
		</div>
		<button
			class="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
			on:click={() => (showAddForm = !showAddForm)}
		>
			{showAddForm ? "Cancel" : "Add Investment"}
		</button>
	</div>

	<!-- Portfolio Allocations Section -->
	<div class="px-6 py-4 bg-purple-50 border-b border-gray-200">
		<div class="flex justify-between items-center mb-3">
			<div>
				<h3 class="text-sm font-semibold text-purple-900">Initial Portfolio Allocations</h3>
				<p class="text-xs text-purple-700 mt-1">
					Total: {formatCurrency(totalPortfolioValue)}
				</p>
			</div>
			<button
				class="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-purple-700 transition-colors"
				on:click={() => (showAddAllocationForm = !showAddAllocationForm)}
			>
				{showAddAllocationForm ? "Cancel" : "Add Allocation"}
			</button>
		</div>

		<!-- Add Allocation Form -->
		{#if showAddAllocationForm}
			<div class="bg-white rounded-md p-4 mb-3">
				<h4 class="text-xs font-medium text-gray-900 mb-3">Add New Allocation</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div>
						<label for="allocationAmount" class="block text-xs font-medium text-gray-700 mb-1"
							>Amount *</label
						>
						<input
							id="allocationAmount"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
							bind:value={newAllocation.amount}
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="allocationDescription" class="block text-xs font-medium text-gray-700 mb-1"
							>Description *</label
						>
						<input
							id="allocationDescription"
							type="text"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
							bind:value={newAllocation.description}
							placeholder="e.g., S&P 500, BTC"
						/>
					</div>
					<div>
						<label for="allocationReturn" class="block text-xs font-medium text-gray-700 mb-1"
							>Annual Return (%)</label
						>
						<input
							id="allocationReturn"
							type="number"
							step="0.1"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
							bind:value={newAllocation.annualReturn}
							placeholder="0.0"
						/>
					</div>
				</div>
				<div class="mt-3">
					<button
						class="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors mr-2"
						on:click={addAllocation}
						disabled={!newAllocation.amount || newAllocation.amount <= 0 || !newAllocation.description}
					>
						Add Allocation
					</button>
					<button
						class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
						on:click={() => (showAddAllocationForm = false)}
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

		<!-- Portfolio Allocations List -->
		{#if $portfolioAllocations.length > 0}
			<div class="bg-white rounded-md overflow-hidden">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
								Description
							</th>
							<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"> Amount </th>
							<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
								Return (%)
							</th>
							<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"> Actions </th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each $portfolioAllocations as allocation (allocation.id)}
							<tr class="hover:bg-gray-50">
								{#if editingAllocation && editingAllocation.id === allocation.id}
									<td class="px-4 py-2">
										<input
											type="text"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingAllocation.description}
										/>
									</td>
									<td class="px-4 py-2">
										<input
											type="number"
											step="0.01"
											min="0"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingAllocation.amount}
										/>
									</td>
									<td class="px-4 py-2">
										<input
											type="number"
											step="0.1"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingAllocation.annualReturn}
										/>
									</td>
									<td class="px-4 py-2 text-sm">
										<button
											class="text-green-600 hover:text-green-900 mr-2"
											on:click={saveAllocationEdit}
										>
											Save
										</button>
										<button
											class="text-gray-600 hover:text-gray-900"
											on:click={cancelAllocationEdit}
										>
											Cancel
										</button>
									</td>
								{:else}
									<td class="px-4 py-2 text-sm text-gray-900">
										{allocation.description || "-"}
									</td>
									<td class="px-4 py-2 text-sm text-purple-600 font-semibold">
										{formatCurrency(allocation.amount)}
									</td>
									<td class="px-4 py-2 text-sm text-gray-900">
										{allocation.annualReturn}%
									</td>
									<td class="px-4 py-2 text-sm">
										<button
											class="text-blue-600 hover:text-blue-900 mr-2"
											on:click={() => startEditingAllocation(allocation)}
										>
											Edit
										</button>
										<button
											class="text-red-600 hover:text-red-900"
											on:click={() => deleteAllocation(allocation.id)}
										>
											Delete
										</button>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="bg-white rounded-md p-4 text-center">
				<p class="text-sm text-gray-500">No portfolio allocations yet. Add your first allocation!</p>
			</div>
		{/if}
	</div>

	<!-- Investment Chart -->
	<div class="px-6 pt-6">
		<InvestmentChart investments={$investmentEntries} portfolioAllocations={$portfolioAllocations} />
	</div>

	<!-- Add Investment Form -->
	{#if showAddForm}
		<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
			<h3 class="text-sm font-medium text-gray-900 mb-3">Add New Investment</h3>
			<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
				<div>
					<label for="type" class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
					<select
						id="type"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						bind:value={newInvestment.type}
					>
						<option value="one-time">One-Time</option>
						<option value="monthly">Monthly Recurring</option>
					</select>
				</div>
				<div>
					<label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
					<input
						id="amount"
						type="number"
						step="0.01"
						min="0"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						bind:value={newInvestment.amount}
						placeholder="0.00"
					/>
				</div>
				<div>
					<label for="annualReturn" class="block text-sm font-medium text-gray-700 mb-1"
						>Annual Return (%)</label
					>
					<input
						id="annualReturn"
						type="number"
						step="0.1"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						bind:value={newInvestment.annualReturn}
						placeholder="0.0"
					/>
				</div>
				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<input
						id="description"
						type="text"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						bind:value={newInvestment.description}
						placeholder="Optional description"
					/>
				</div>
				<div>
					<label for="date" class="block text-sm font-medium text-gray-700 mb-1">
						{newInvestment.type === "monthly" ? "Start Date *" : "Date *"}
					</label>
					<input
						id="date"
						type="date"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						bind:value={newInvestment.date}
					/>
				</div>
			</div>
			<div class="mt-4">
				<button
					class="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors mr-2"
					on:click={addInvestment}
					disabled={!newInvestment.amount || newInvestment.amount <= 0}
				>
					Add Investment
				</button>
				<button
					class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
					on:click={() => (showAddForm = false)}
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Investment List -->
	<div class="overflow-x-auto">
		{#if $investmentEntries.length > 0}
			<!-- Monthly Investments Section -->
			{#if monthlyInvestments.length > 0}
				<div class="px-6 py-4 bg-purple-50 border-b border-gray-200">
					<h3 class="text-sm font-semibold text-purple-900">
						Monthly Investments ({monthlyInvestments.length})
					</h3>
				</div>
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Type
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Date
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Amount
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Return (%)
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Description
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each monthlyInvestments as investment (investment.id)}
							<tr class="hover:bg-gray-50">
								{#if editingInvestment && editingInvestment.id === investment.id}
									<td class="px-6 py-4 whitespace-nowrap">
										<select
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.type}
										>
											<option value="one-time">One-Time</option>
											<option value="monthly">Monthly</option>
										</select>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="date"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.date}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="number"
											step="0.01"
											min="0"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.amount}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="number"
											step="0.1"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.annualReturn}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="text"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.description}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button class="text-green-600 hover:text-green-900 mr-2" on:click={saveEdit}>
											Save
										</button>
										<button class="text-gray-600 hover:text-gray-900" on:click={cancelEdit}>
											Cancel
										</button>
									</td>
								{:else}
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										<span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
											Monthly
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDate(investment.date)}
										<span class="text-xs text-gray-500">(Start)</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
										{formatCurrency(investment.amount)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{investment.annualReturn}%
									</td>
									<td class="px-6 py-4 text-sm text-gray-900">
										{investment.description || "-"}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button
											class="text-blue-600 hover:text-blue-900 mr-2"
											on:click={() => startEditing(investment)}
										>
											Edit
										</button>
										<button
											class="text-red-600 hover:text-red-900"
											on:click={() => deleteInvestment(investment.id)}
										>
											Delete
										</button>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}

			<!-- One-Time Investments Section -->
			{#if oneTimeInvestments.length > 0}
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<h3 class="text-sm font-semibold text-gray-900">
						One-Time Investments ({oneTimeInvestments.length})
					</h3>
				</div>
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Type
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Date
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Amount
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Return (%)
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Description
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each oneTimeInvestments as investment (investment.id)}
							<tr class="hover:bg-gray-50">
								{#if editingInvestment && editingInvestment.id === investment.id}
									<td class="px-6 py-4 whitespace-nowrap">
										<select
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.type}
										>
											<option value="one-time">One-Time</option>
											<option value="monthly">Monthly</option>
										</select>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="date"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.date}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="number"
											step="0.01"
											min="0"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.amount}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="number"
											step="0.1"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.annualReturn}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="text"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingInvestment.description}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button class="text-green-600 hover:text-green-900 mr-2" on:click={saveEdit}>
											Save
										</button>
										<button class="text-gray-600 hover:text-gray-900" on:click={cancelEdit}>
											Cancel
										</button>
									</td>
								{:else}
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
											One-Time
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDate(investment.date)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
										{formatCurrency(investment.amount)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{investment.annualReturn}%
									</td>
									<td class="px-6 py-4 text-sm text-gray-900">
										{investment.description || "-"}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button
											class="text-blue-600 hover:text-blue-900 mr-2"
											on:click={() => startEditing(investment)}
										>
											Edit
										</button>
										<button
											class="text-red-600 hover:text-red-900"
											on:click={() => deleteInvestment(investment.id)}
										>
											Delete
										</button>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		{:else}
			<div class="text-center py-8">
				<p class="text-gray-500">No investment entries yet. Add your first investment!</p>
			</div>
		{/if}
	</div>
</div>
