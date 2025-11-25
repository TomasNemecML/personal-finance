<script>
	import {
		monthlyData,
		incomeEntries,
		expenseEntries,
		loansGiven,
		loansTaken,
		startingSavings,
		exportAllData,
		importAllData,
	} from "$lib/stores.js";
	import MonthlyTable from "$lib/components/MonthlyTable.svelte";
	import IncomeManager from "$lib/components/IncomeManager.svelte";
	import ExpenseManager from "$lib/components/ExpenseManager.svelte";
	import InvestmentManager from "$lib/components/InvestmentManager.svelte";
	import LoansManager from "$lib/components/LoansManager.svelte";
	import ChatAssistant from "$lib/components/ChatAssistant.svelte";

	let activeTab = "overview";
	let editingStartingSavings = false;
	let tempStartingSavings = $startingSavings;
	let importMessage = "";
	let importFileInput;

	function formatCurrency(amount) {
		return new Intl.NumberFormat("sk-SK", {
			style: "currency",
			currency: "EUR",
		}).format(amount);
	}

	function startEditingSavings() {
		tempStartingSavings = $startingSavings;
		editingStartingSavings = true;
	}

	function saveStartingSavings() {
		startingSavings.set(Number(tempStartingSavings) || 0);
		editingStartingSavings = false;
	}

	function cancelEditingSavings() {
		editingStartingSavings = false;
		tempStartingSavings = $startingSavings;
	}

	function handleExport() {
		exportAllData();
	}

	function handleImportClick() {
		importFileInput.click();
	}

	async function handleImportFile(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const result = await importAllData(file);
			importMessage = result.message;
			setTimeout(() => {
				importMessage = "";
			}, 3000);
		} catch (error) {
			importMessage = error.message;
			setTimeout(() => {
				importMessage = "";
			}, 5000);
		}

		// Reset the file input
		event.target.value = "";
	}
</script>

<svelte:head>
	<title>Personal Finance Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="container mx-auto px-4 py-8">
		<div class="flex justify-between items-center mb-4">
			<h1 class="text-3xl font-bold text-gray-900">Personal Finance Tracker</h1>

			<div class="flex items-center gap-4">
				<!-- Export/Import Buttons -->
				<div class="flex gap-2">
					<button
						class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
						on:click={handleExport}
					>
						📥 Export Data
					</button>
					<button
						class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
						on:click={handleImportClick}
					>
						📤 Import Data
					</button>
					<input
						type="file"
						accept=".json"
						bind:this={importFileInput}
						on:change={handleImportFile}
						class="hidden"
					/>
				</div>

				<!-- Starting Savings Display/Edit -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex gap-4">
					<!-- Savings -->
					<div>
						{#if editingStartingSavings}
							<div class="flex items-center gap-2">
								<label for="startingSavings" class="text-sm font-medium text-gray-700">Savings:</label>
								<input
									id="startingSavings"
									type="number"
									step="0.01"
									class="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									bind:value={tempStartingSavings}
								/>
								<button
									class="text-green-600 hover:text-green-900 text-sm font-medium"
									on:click={saveStartingSavings}
								>
									Save
								</button>
								<button
									class="text-gray-600 hover:text-gray-900 text-sm font-medium"
									on:click={cancelEditingSavings}
								>
									Cancel
								</button>
							</div>
						{:else}
							<div class="flex items-center gap-2">
								<span class="text-sm text-gray-600">Savings:</span>
								<span class="text-lg font-bold text-blue-600">{formatCurrency($startingSavings)}</span>
								<button
									class="text-blue-600 hover:text-blue-900 text-sm font-medium"
									on:click={startEditingSavings}
								>
									Edit
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Import Message -->
		{#if importMessage}
			<div
				class="mb-4 p-4 rounded-md {importMessage.includes('success')
					? 'bg-green-100 text-green-800'
					: 'bg-red-100 text-red-800'}"
			>
				{importMessage}
			</div>
		{/if}

		<!-- Navigation Tabs -->
		<div class="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-8 mt-4">
			<button
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'overview'
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-600 hover:text-gray-900'}"
				on:click={() => (activeTab = "overview")}
			>
				Monthly Overview
			</button>
			<button
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'income'
					? 'bg-green-100 text-green-800 shadow-sm'
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
				on:click={() => (activeTab = "income")}
			>
				Income
			</button>
			<button
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'expenses'
					? 'bg-red-100 text-red-800 shadow-sm'
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
				on:click={() => (activeTab = "expenses")}
			>
				Expenses
			</button>
			<button
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'investments'
					? 'bg-purple-100 text-purple-800 shadow-sm'
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
				on:click={() => (activeTab = "investments")}
			>
				Investments
			</button>
			<button
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'loans'
					? 'bg-orange-100 text-orange-800 shadow-sm'
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
				on:click={() => (activeTab = "loans")}
			>
				Loans
			</button>
			<button
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'chat'
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-600 hover:text-gray-900'}"
				on:click={() => (activeTab = "chat")}
			>
				AI Assistant
			</button>
		</div>

		<!-- Tab Content -->
		{#if activeTab === "overview"}
			<MonthlyTable data={$monthlyData} />
		{:else if activeTab === "income"}
			<IncomeManager />
		{:else if activeTab === "expenses"}
			<ExpenseManager />
		{:else if activeTab === "investments"}
			<InvestmentManager />
		{:else if activeTab === "loans"}
			<LoansManager />
		{:else if activeTab === "chat"}
			<ChatAssistant />
		{/if}
	</div>
</div>
