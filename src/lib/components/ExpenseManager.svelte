<script>
	import { expenseEntries, financeActions } from "$lib/stores.js";

	let showAddForm = false;
	let newExpense = {
		amount: "",
		description: "",
		date: new Date().toISOString().split("T")[0],
		type: "one-time",
	};
	let editingExpense = null;

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

	function addExpense() {
		if (!newExpense.amount || newExpense.amount <= 0) return;

		financeActions.addExpense(
			parseFloat(newExpense.amount),
			newExpense.description,
			new Date(newExpense.date),
			newExpense.type,
		);

		// Reset form
		newExpense = {
			amount: "",
			description: "",
			date: new Date().toISOString().split("T")[0],
			type: "one-time",
		};
		showAddForm = false;
	}

	function startEditing(expense) {
		editingExpense = { ...expense, type: expense.type || "one-time" };
	}

	function saveEdit() {
		if (!editingExpense.amount || editingExpense.amount <= 0) return;

		financeActions.updateExpense(editingExpense.id, {
			amount: parseFloat(editingExpense.amount),
			description: editingExpense.description,
			date: editingExpense.date,
			type: editingExpense.type,
		});

		editingExpense = null;
	}

	function cancelEdit() {
		editingExpense = null;
	}

	function deleteExpense(id) {
		if (confirm("Are you sure you want to delete this expense entry?")) {
			financeActions.deleteExpense(id);
		}
	}

	// Separate and sort expenses
	$: monthlyExpenses = $expenseEntries.filter((expense) => (expense.type || "one-time") === "monthly");
	$: oneTimeExpenses = $expenseEntries
		.filter((expense) => (expense.type || "one-time") === "one-time")
		.sort((a, b) => new Date(a.date) - new Date(b.date));
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
	<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
		<div>
			<h2 class="text-xl font-semibold text-gray-900">Expense Management</h2>
			<p class="text-sm text-gray-600 mt-1">Track your expenses</p>
		</div>
		<button
			class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
			on:click={() => (showAddForm = !showAddForm)}
		>
			{showAddForm ? "Cancel" : "Add Expense"}
		</button>
	</div>

	<!-- Add Expense Form -->
	{#if showAddForm}
		<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
			<h3 class="text-sm font-medium text-gray-900 mb-3">Add New Expense</h3>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div>
					<label for="type" class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
					<select
						id="type"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						bind:value={newExpense.type}
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
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						bind:value={newExpense.amount}
						placeholder="0.00"
					/>
				</div>
				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<input
						id="description"
						type="text"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						bind:value={newExpense.description}
						placeholder="Optional description"
					/>
				</div>
				<div>
					<label for="date" class="block text-sm font-medium text-gray-700 mb-1">
						{newExpense.type === "monthly" ? "Start Date *" : "Date *"}
					</label>
					<input
						id="date"
						type="date"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
						bind:value={newExpense.date}
					/>
				</div>
			</div>
			<div class="mt-4">
				<button
					class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors mr-2"
					on:click={addExpense}
					disabled={!newExpense.amount || newExpense.amount <= 0}
				>
					Add Expense
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

	<!-- Expense List -->
	<div class="overflow-x-auto">
		{#if $expenseEntries.length > 0}
			<!-- Monthly Expenses Section -->
			{#if monthlyExpenses.length > 0}
				<div class="px-6 py-4 bg-blue-50 border-b border-gray-200">
					<h3 class="text-sm font-semibold text-blue-900">
						Monthly Expenses ({monthlyExpenses.length})
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
						{#each monthlyExpenses as expense (expense.id)}
							<tr class="hover:bg-gray-50">
								{#if editingExpense && editingExpense.id === expense.id}
									<td class="px-6 py-4 whitespace-nowrap">
										<select
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingExpense.type}
										>
											<option value="one-time">One-Time</option>
											<option value="monthly">Monthly</option>
										</select>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="date"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingExpense.date}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="number"
											step="0.01"
											min="0"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingExpense.amount}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="text"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingExpense.description}
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
										<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
											Monthly
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDate(expense.date)}
										<span class="text-xs text-gray-500">(Start)</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
										{formatCurrency(expense.amount)}
									</td>
									<td class="px-6 py-4 text-sm text-gray-900">
										{expense.description || "-"}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button
											class="text-blue-600 hover:text-blue-900 mr-2"
											on:click={() => startEditing(expense)}
										>
											Edit
										</button>
										<button
											class="text-red-600 hover:text-red-900"
											on:click={() => deleteExpense(expense.id)}
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

			<!-- One-Time Expenses Section -->
			{#if oneTimeExpenses.length > 0}
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<h3 class="text-sm font-semibold text-gray-900">
						One-Time Expenses ({oneTimeExpenses.length})
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
						{#each oneTimeExpenses as expense (expense.id)}
							<tr class="hover:bg-gray-50">
								{#if editingExpense && editingExpense.id === expense.id}
									<td class="px-6 py-4 whitespace-nowrap">
										<select
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingExpense.type}
										>
											<option value="one-time">One-Time</option>
											<option value="monthly">Monthly</option>
										</select>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="date"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingExpense.date}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="number"
											step="0.01"
											min="0"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingExpense.amount}
										/>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<input
											type="text"
											class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
											bind:value={editingExpense.description}
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
										{formatDate(expense.date)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
										{formatCurrency(expense.amount)}
									</td>
									<td class="px-6 py-4 text-sm text-gray-900">
										{expense.description || "-"}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button
											class="text-blue-600 hover:text-blue-900 mr-2"
											on:click={() => startEditing(expense)}
										>
											Edit
										</button>
										<button
											class="text-red-600 hover:text-red-900"
											on:click={() => deleteExpense(expense.id)}
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
				<p class="text-gray-500">No expense entries yet. Add your first expense!</p>
			</div>
		{/if}
	</div>
</div>
