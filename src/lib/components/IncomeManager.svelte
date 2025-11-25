<script>
	import { incomeEntries, financeActions } from "$lib/stores.js";

	let showAddForm = false;
	let newIncome = {
		amount: "",
		description: "",
		date: new Date().toISOString().split("T")[0],
		type: "one-time",
	};
	let editingIncome = null;

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

	function addIncome() {
		if (!newIncome.amount || newIncome.amount <= 0) return;

		financeActions.addIncome(
			parseFloat(newIncome.amount),
			newIncome.description,
			new Date(newIncome.date),
			newIncome.type,
		);

		// Reset form
		newIncome = {
			amount: "",
			description: "",
			date: new Date().toISOString().split("T")[0],
			type: "one-time",
		};
		showAddForm = false;
	}

	function startEditing(income) {
		editingIncome = { ...income, type: income.type || "one-time" };
	}

	function saveEdit() {
		if (!editingIncome.amount || editingIncome.amount <= 0) return;

		financeActions.updateIncome(editingIncome.id, {
			amount: parseFloat(editingIncome.amount),
			description: editingIncome.description,
			date: editingIncome.date,
			type: editingIncome.type,
		});

		editingIncome = null;
	}

	function cancelEdit() {
		editingIncome = null;
	}

	function deleteIncome(id) {
		if (confirm("Are you sure you want to delete this income entry?")) {
			financeActions.deleteIncome(id);
		}
	}

	// Separate and sort income
	$: monthlyIncome = $incomeEntries.filter((income) => (income.type || "one-time") === "monthly");
	$: oneTimeIncome = $incomeEntries
		.filter((income) => (income.type || "one-time") === "one-time")
		.sort((a, b) => new Date(a.date) - new Date(b.date));
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
	<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
		<div>
			<h2 class="text-xl font-semibold text-gray-900">Income Management</h2>
			<p class="text-sm text-gray-600 mt-1">Track your income sources</p>
		</div>
		<button
			class="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
			on:click={() => (showAddForm = !showAddForm)}
		>
			{showAddForm ? "Cancel" : "Add Income"}
		</button>
	</div>

	<!-- Add Income Form -->
	{#if showAddForm}
		<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
			<h3 class="text-sm font-medium text-gray-900 mb-3">Add New Income</h3>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div>
					<label for="type" class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
					<select
						id="type"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						bind:value={newIncome.type}
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
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						bind:value={newIncome.amount}
						placeholder="0.00"
					/>
				</div>
				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<input
						id="description"
						type="text"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						bind:value={newIncome.description}
						placeholder="Optional description"
					/>
				</div>
				<div>
					<label for="date" class="block text-sm font-medium text-gray-700 mb-1">
						{newIncome.type === "monthly" ? "Start Date *" : "Date *"}
					</label>
					<input
						id="date"
						type="date"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						bind:value={newIncome.date}
					/>
				</div>
			</div>
			<div class="mt-4">
				<button
					class="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors mr-2"
					on:click={addIncome}
					disabled={!newIncome.amount || newIncome.amount <= 0}
				>
					Add Income
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

	<!-- Income List -->
	<div class="overflow-x-auto">
		{#if $incomeEntries.length > 0}
			<!-- Monthly Income Section -->
			{#if monthlyIncome.length > 0}
				<div class="px-6 py-4 bg-blue-50 border-b border-gray-200">
					<h3 class="text-sm font-semibold text-blue-900">
						Monthly Income ({monthlyIncome.length})
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
								Description
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each monthlyIncome as income (income.id)}
							<tr class="hover:bg-gray-50">
								{#if editingIncome && editingIncome.id === income.id}
									<td class="px-6 py-4 whitespace-nowrap">
										<select
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingIncome.type}
										>
											<option value="one-time">One-Time</option>
											<option value="monthly">Monthly</option>
										</select>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="date"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingIncome.date}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="number"
											step="0.01"
											min="0"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingIncome.amount}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="text"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingIncome.description}
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
										<span
											class="px-2 py-1 text-xs rounded-full {(income.type || 'one-time') ===
											'monthly'
												? 'bg-blue-100 text-blue-800'
												: 'bg-gray-100 text-gray-800'}"
										>
											{(income.type || "one-time") === "monthly" ? "Monthly" : "One-Time"}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDate(income.date)}
										{#if (income.type || "one-time") === "monthly"}
											<span class="text-xs text-gray-500">(Start)</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
										{formatCurrency(income.amount)}
									</td>
									<td class="px-6 py-4 text-sm text-gray-900">
										{income.description || "-"}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button
											class="text-blue-600 hover:text-blue-900 mr-2"
											on:click={() => startEditing(income)}
										>
											Edit
										</button>
										<button
											class="text-red-600 hover:text-red-900"
											on:click={() => deleteIncome(income.id)}
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

			<!-- One-Time Income Section -->
			{#if oneTimeIncome.length > 0}
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<h3 class="text-sm font-semibold text-gray-900">
						One-Time Income ({oneTimeIncome.length})
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
								Description
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each oneTimeIncome as income (income.id)}
							<tr class="hover:bg-gray-50">
								{#if editingIncome && editingIncome.id === income.id}
									<td class="px-6 py-4 whitespace-nowrap">
										<select
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingIncome.type}
										>
											<option value="one-time">One-Time</option>
											<option value="monthly">Monthly</option>
										</select>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="date"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingIncome.date}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="number"
											step="0.01"
											min="0"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingIncome.amount}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="text"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingIncome.description}
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
										{formatDate(income.date)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
										{formatCurrency(income.amount)}
									</td>
									<td class="px-6 py-4 text-sm text-gray-900">
										{income.description || "-"}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button
											class="text-blue-600 hover:text-blue-900 mr-2"
											on:click={() => startEditing(income)}
										>
											Edit
										</button>
										<button
											class="text-red-600 hover:text-red-900"
											on:click={() => deleteIncome(income.id)}
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
				<p class="text-gray-500">No income entries yet. Add your first income source!</p>
			</div>
		{/if}
	</div>
</div>
