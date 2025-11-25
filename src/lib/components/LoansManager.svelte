<script>
	import { loansGiven, loansTaken, financeActions } from "$lib/stores.js";

	let activeTab = "given";
	let showAddForm = false;
	let newLoan = {
		mode: "monthly",
		startDate: new Date().toISOString().split("T")[0],
		endDate: "",
		principalAmount: "",
		totalToBeReceived: "",
		monthlyPayout: "",
		description: "",
		payouts: [],
	};
	let editingLoan = null;

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

	function calculateMonthlyPayout() {
		if (newLoan.totalToBeReceived && newLoan.startDate && newLoan.endDate) {
			const start = new Date(newLoan.startDate);
			const end = new Date(newLoan.endDate);
			const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
			// Payments start the month after the loan is given, so subtract 1
			const paymentMonths = totalMonths - 1;
			if (paymentMonths > 0) {
				newLoan.monthlyPayout = (parseFloat(newLoan.totalToBeReceived) / paymentMonths).toFixed(2);
			}
		}
	}

	function calculateInterestRate(principal, totalReceived) {
		if (!principal || !totalReceived || principal <= 0) return 0;
		const interest = totalReceived - principal;
		const rate = (interest / principal) * 100;
		return rate.toFixed(2);
	}

	function calculateManualTotal() {
		if (newLoan.payouts && newLoan.payouts.length > 0) {
			const total = newLoan.payouts.reduce((sum, payout) => {
				return sum + (parseFloat(payout.amount) || 0);
			}, 0);
			newLoan.totalToBeReceived = total.toFixed(2);
		}
	}

	function addLoan() {
		if (activeTab === "given") {
			financeActions.addLoanGiven(newLoan);
		} else {
			financeActions.addLoanTaken(newLoan);
		}
		resetForm();
	}

	function resetForm() {
		newLoan = {
			mode: "monthly",
			startDate: new Date().toISOString().split("T")[0],
			endDate: "",
			principalAmount: "",
			totalToBeReceived: "",
			monthlyPayout: "",
			description: "",
			payouts: [],
		};
		showAddForm = false;
	}

	function startEditing(loan) {
		editingLoan = { ...loan };
		showAddForm = false; // Close add form if open
	}

	function saveEdit() {
		if (activeTab === "given") {
			financeActions.updateLoanGiven(editingLoan.id, editingLoan);
		} else {
			financeActions.updateLoanTaken(editingLoan.id, editingLoan);
		}
		editingLoan = null;
	}

	function calculateEditMonthlyPayout() {
		if (editingLoan && editingLoan.totalToBeReceived && editingLoan.startDate && editingLoan.endDate) {
			const start = new Date(editingLoan.startDate);
			const end = new Date(editingLoan.endDate);
			const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
			// Payments start the month after the loan is given, so subtract 1
			const paymentMonths = totalMonths - 1;
			if (paymentMonths > 0) {
				editingLoan.monthlyPayout = (parseFloat(editingLoan.totalToBeReceived) / paymentMonths).toFixed(2);
			}
		}
	}

	function calculateEditManualTotal() {
		if (editingLoan && editingLoan.payouts && editingLoan.payouts.length > 0) {
			const total = editingLoan.payouts.reduce((sum, payout) => {
				return sum + (parseFloat(payout.amount) || 0);
			}, 0);
			editingLoan.totalToBeReceived = total.toFixed(2);
		}
	}

	function addEditPayout() {
		if (editingLoan) {
			editingLoan.payouts = [
				...editingLoan.payouts,
				{
					id: Date.now(),
					date: new Date().toISOString().split("T")[0],
					amount: "",
				},
			];
		}
	}

	function removeEditPayout(index) {
		if (editingLoan) {
			editingLoan.payouts = editingLoan.payouts.filter((_, i) => i !== index);
			calculateEditManualTotal();
		}
	}

	function updateEditPayoutAmount() {
		calculateEditManualTotal();
	}

	function cancelEdit() {
		editingLoan = null;
	}

	function deleteLoan(id) {
		if (confirm("Are you sure you want to delete this loan?")) {
			if (activeTab === "given") {
				financeActions.deleteLoanGiven(id);
			} else {
				financeActions.deleteLoanTaken(id);
			}
		}
	}

	function addPayout() {
		newLoan.payouts = [
			...newLoan.payouts,
			{
				id: Date.now(),
				date: new Date().toISOString().split("T")[0],
				amount: "",
			},
		];
	}

	function removePayout(index) {
		newLoan.payouts = newLoan.payouts.filter((_, i) => i !== index);
		calculateManualTotal();
	}

	function updatePayoutAmount() {
		calculateManualTotal();
	}

	$: currentLoans = activeTab === "given" ? $loansGiven : $loansTaken;
	$: if (newLoan.mode === "monthly") {
		calculateMonthlyPayout();
	}
	$: interestRate = calculateInterestRate(newLoan.principalAmount, newLoan.totalToBeReceived);
	$: if (editingLoan && editingLoan.mode === "monthly") {
		calculateEditMonthlyPayout();
	}
	$: editInterestRate = editingLoan
		? calculateInterestRate(
				editingLoan.principalAmount || editingLoan.totalSum,
				editingLoan.totalToBeReceived || editingLoan.totalSum,
			)
		: 0;
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
	<div class="px-6 py-4 border-b border-gray-200">
		<div class="flex justify-between items-center mb-4">
			<div>
				<h2 class="text-xl font-semibold text-gray-900">Loans Management</h2>
				<p class="text-sm text-gray-600 mt-1">Track loans given and taken</p>
			</div>
			<button
				class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
				on:click={() => (showAddForm = !showAddForm)}
			>
				{showAddForm ? "Cancel" : "Add Loan"}
			</button>
		</div>

		<!-- Loan Type Tabs -->
		<div class="flex space-x-1 bg-gray-100 rounded-lg p-1">
			<button
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'given'
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-600 hover:text-gray-900'}"
				on:click={() => (activeTab = "given")}
			>
				Loans Given
			</button>
			<button
				class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'taken'
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-600 hover:text-gray-900'}"
				on:click={() => (activeTab = "taken")}
			>
				Loans Taken
			</button>
		</div>
	</div>

	<!-- Add Loan Form -->
	{#if showAddForm}
		<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
			<h3 class="text-sm font-medium text-gray-900 mb-3">
				Add New {activeTab === "given" ? "Loan Given" : "Loan Taken"}
			</h3>

			<!-- Mode Selection -->
			<div class="mb-4">
				<fieldset>
					<legend class="block text-sm font-medium text-gray-700 mb-2">Payout Mode</legend>
					<div class="flex space-x-4">
						<label class="flex items-center">
							<input type="radio" class="mr-2" bind:group={newLoan.mode} value="monthly" />
							Monthly Payout
						</label>
						<label class="flex items-center">
							<input type="radio" class="mr-2" bind:group={newLoan.mode} value="manual" />
							Manual Payout
						</label>
					</div>
				</fieldset>
			</div>

			{#if newLoan.mode === "monthly"}
				<!-- Monthly Mode Fields -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
					<div>
						<label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
						<input
							id="startDate"
							type="date"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={newLoan.startDate}
						/>
					</div>
					<div>
						<label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
						<input
							id="endDate"
							type="date"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={newLoan.endDate}
						/>
					</div>
					<div>
						<label for="principalAmount" class="block text-sm font-medium text-gray-700 mb-1"
							>{activeTab === "given" ? "Principal Amount (Given)" : "Principal Amount (Received)"} *</label
						>
						<input
							id="principalAmount"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={newLoan.principalAmount}
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="totalToBeReceived" class="block text-sm font-medium text-gray-700 mb-1"
							>{activeTab === "given" ? "Total to Receive" : "Total to Pay Back"} *</label
						>
						<input
							id="totalToBeReceived"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={newLoan.totalToBeReceived}
							placeholder="0.00"
						/>
					</div>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label for="monthlyPayout" class="block text-sm font-medium text-gray-700 mb-1"
							>Monthly Payout</label
						>
						<input
							id="monthlyPayout"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
							bind:value={newLoan.monthlyPayout}
							readonly
						/>
					</div>
					<div>
						<label for="interestRate" class="block text-sm font-medium text-gray-700 mb-1"
							>Interest Rate</label
						>
						<div class="flex items-center">
							<input
								id="interestRate"
								type="text"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
								value={interestRate}
								readonly
							/>
							<span class="ml-2 text-sm text-gray-600">%</span>
						</div>
					</div>
				</div>
				<div class="mb-4">
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<input
						id="description"
						type="text"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						bind:value={newLoan.description}
						placeholder="Optional description"
					/>
				</div>
			{:else}
				<!-- Manual Mode Fields -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label for="principalAmount" class="block text-sm font-medium text-gray-700 mb-1"
							>{activeTab === "given" ? "Principal Amount (Given)" : "Principal Amount (Received)"} *</label
						>
						<input
							id="principalAmount"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={newLoan.principalAmount}
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="totalToBeReceivedManual" class="block text-sm font-medium text-gray-700 mb-1"
							>{activeTab === "given"
								? "Total to Receive (Auto-calculated)"
								: "Total to Pay Back (Auto-calculated)"}</label
						>
						<div class="flex items-center">
							<input
								id="totalToBeReceivedManual"
								type="number"
								step="0.01"
								min="0"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
								bind:value={newLoan.totalToBeReceived}
								readonly
							/>
							<span class="ml-2 text-sm text-gray-600">
								({interestRate}% interest)
							</span>
						</div>
					</div>
				</div>
				<div class="mb-4">
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<input
						id="description"
						type="text"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						bind:value={newLoan.description}
						placeholder="Optional description"
					/>
				</div>
				<div class="mb-4">
					<div class="flex justify-between items-center mb-2">
						<h4 class="block text-sm font-medium text-gray-700">Payouts</h4>
						<button
							type="button"
							class="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
							on:click={addPayout}
						>
							Add Payout
						</button>
					</div>
					{#each newLoan.payouts as payout, index (payout.id)}
						<div class="flex gap-2 mb-2">
							<input
								type="date"
								class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								bind:value={payout.date}
							/>
							<input
								type="number"
								step="0.01"
								min="0"
								class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								bind:value={payout.amount}
								on:input={updatePayoutAmount}
								placeholder="Amount"
							/>
							<button
								type="button"
								class="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
								on:click={() => removePayout(index)}
							>
								Remove
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<div class="mt-4">
				<button
					class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors mr-2"
					on:click={addLoan}
					disabled={newLoan.mode === "monthly" &&
						(!newLoan.principalAmount ||
							!newLoan.totalToBeReceived ||
							!newLoan.startDate ||
							!newLoan.endDate)}
				>
					Add Loan
				</button>
				<button
					class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
					on:click={resetForm}
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Edit Loan Form -->
	{#if editingLoan}
		<div class="px-6 py-4 bg-blue-50 border-b border-blue-200">
			<h3 class="text-sm font-medium text-gray-900 mb-3">
				Edit {activeTab === "given" ? "Loan Given" : "Loan Taken"}
			</h3>

			{#if editingLoan.mode === "monthly"}
				<!-- Monthly Mode Fields -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
					<div>
						<label for="editStartDate" class="block text-sm font-medium text-gray-700 mb-1"
							>Start Date *</label
						>
						<input
							id="editStartDate"
							type="date"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={editingLoan.startDate}
						/>
					</div>
					<div>
						<label for="editEndDate" class="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
						<input
							id="editEndDate"
							type="date"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={editingLoan.endDate}
						/>
					</div>
					<div>
						<label for="editPrincipalAmount" class="block text-sm font-medium text-gray-700 mb-1"
							>{activeTab === "given" ? "Principal Amount (Given)" : "Principal Amount (Received)"} *</label
						>
						<input
							id="editPrincipalAmount"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={editingLoan.principalAmount}
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="editTotalToBeReceived" class="block text-sm font-medium text-gray-700 mb-1"
							>{activeTab === "given" ? "Total to Receive" : "Total to Pay Back"} *</label
						>
						<input
							id="editTotalToBeReceived"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={editingLoan.totalToBeReceived}
							placeholder="0.00"
						/>
					</div>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label for="editMonthlyPayout" class="block text-sm font-medium text-gray-700 mb-1"
							>Monthly Payout</label
						>
						<input
							id="editMonthlyPayout"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
							bind:value={editingLoan.monthlyPayout}
							readonly
						/>
					</div>
					<div>
						<label for="editInterestRate" class="block text-sm font-medium text-gray-700 mb-1"
							>Interest Rate</label
						>
						<div class="flex items-center">
							<input
								id="editInterestRate"
								type="text"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
								value={editInterestRate}
								readonly
							/>
							<span class="ml-2 text-sm text-gray-600">%</span>
						</div>
					</div>
				</div>
				<div class="mb-4">
					<label for="editDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label
					>
					<input
						id="editDescription"
						type="text"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						bind:value={editingLoan.description}
						placeholder="Optional description"
					/>
				</div>
			{:else}
				<!-- Manual Mode Fields -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label for="editPrincipalAmount" class="block text-sm font-medium text-gray-700 mb-1"
							>{activeTab === "given" ? "Principal Amount (Given)" : "Principal Amount (Received)"} *</label
						>
						<input
							id="editPrincipalAmount"
							type="number"
							step="0.01"
							min="0"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							bind:value={editingLoan.principalAmount}
							placeholder="0.00"
						/>
					</div>
					<div>
						<label for="editTotalToBeReceivedManual" class="block text-sm font-medium text-gray-700 mb-1"
							>{activeTab === "given"
								? "Total to Receive (Auto-calculated)"
								: "Total to Pay Back (Auto-calculated)"}</label
						>
						<div class="flex items-center">
							<input
								id="editTotalToBeReceivedManual"
								type="number"
								step="0.01"
								min="0"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
								bind:value={editingLoan.totalToBeReceived}
								readonly
							/>
							<span class="ml-2 text-sm text-gray-600">
								({editInterestRate}% interest)
							</span>
						</div>
					</div>
				</div>
				<div class="mb-4">
					<label for="editDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label
					>
					<input
						id="editDescription"
						type="text"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						bind:value={editingLoan.description}
						placeholder="Optional description"
					/>
				</div>
				<div class="mb-4">
					<div class="flex justify-between items-center mb-2">
						<h4 class="block text-sm font-medium text-gray-700">Payouts</h4>
						<button
							type="button"
							class="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
							on:click={addEditPayout}
						>
							Add Payout
						</button>
					</div>
					{#if editingLoan.payouts}
						{#each editingLoan.payouts as payout, index (payout.id)}
							<div class="flex gap-2 mb-2">
								<input
									type="date"
									class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									bind:value={payout.date}
								/>
								<input
									type="number"
									step="0.01"
									min="0"
									class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									bind:value={payout.amount}
									on:input={updateEditPayoutAmount}
									placeholder="Amount"
								/>
								<button
									type="button"
									class="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
									on:click={() => removeEditPayout(index)}
								>
									Remove
								</button>
							</div>
						{/each}
					{/if}
				</div>
			{/if}

			<div class="mt-4">
				<button
					class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors mr-2"
					on:click={saveEdit}
				>
					Save Changes
				</button>
				<button
					class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
					on:click={cancelEdit}
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Loans List -->
	<div class="overflow-x-auto">
		{#if currentLoans.length > 0}
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Description
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Mode
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							{activeTab === "given" ? "Principal (Given)" : "Principal (Received)"}
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							{activeTab === "given" ? "To Receive" : "To Pay Back"}
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Interest
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Details
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each currentLoans as loan (loan.id)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 text-sm text-gray-900">
								{loan.description || "Untitled Loan"}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								<span
									class="px-2 py-1 text-xs rounded-full {loan.mode === 'monthly'
										? 'bg-blue-100 text-blue-800'
										: 'bg-green-100 text-green-800'}"
								>
									{loan.mode === "monthly" ? "Monthly" : "Manual"}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{formatCurrency(loan.principalAmount || loan.totalSum || 0)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{#if loan.mode === "monthly"}
									{formatCurrency(loan.totalToBeReceived || loan.totalSum || 0)}
								{:else}
									{formatCurrency(
										loan.payouts?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0,
									)}
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								{#if loan.mode === "monthly"}
									<span class="text-green-600 font-medium">
										{calculateInterestRate(
											loan.principalAmount || loan.totalSum,
											loan.totalToBeReceived || loan.totalSum,
										)}%
									</span>
								{:else}
									<span class="text-green-600 font-medium">
										{calculateInterestRate(
											loan.principalAmount,
											loan.payouts?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
										)}%
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm text-gray-900">
								{#if loan.mode === "monthly"}
									<div>
										<div>Monthly: {formatCurrency(loan.monthlyPayout || 0)}</div>
										<div class="text-xs text-gray-500">
											{formatDate(loan.startDate)} - {formatDate(loan.endDate)}
										</div>
									</div>
								{:else}
									<div>
										<div>{loan.payouts?.length || 0} payouts</div>
									</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<button
									class="text-blue-600 hover:text-blue-900 mr-2"
									on:click={() => startEditing(loan)}
								>
									Edit
								</button>
								<button class="text-red-600 hover:text-red-900" on:click={() => deleteLoan(loan.id)}>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="text-center py-8">
				<p class="text-gray-500">
					No {activeTab === "given" ? "loans given" : "loans taken"} yet. Add your first loan!
				</p>
			</div>
		{/if}
	</div>
</div>
