<script>
	import {
		monthlyData,
		incomeEntries,
		expenseEntries,
		loansGiven,
		loansTaken,
		startingSavings,
		investmentEntries,
		realizedEntries,
	} from "$lib/stores.js";
	import { onMount } from "svelte";

	import ChatPieChart from "./chat-widgets/ChatPieChart.svelte";
	import ChatBarChart from "./chat-widgets/ChatBarChart.svelte";

	let messages = [];
	let userInput = "";
	let isLoading = false;
	let errorMessage = "";
	let chatContainer;
	let shouldAutoScroll = true;

	// Load messages from localStorage
	onMount(() => {
		const stored = localStorage.getItem("financeApp_chatMessages");
		if (stored) {
			messages = JSON.parse(stored);
			shouldAutoScroll = false; // Don't auto-scroll when loading from storage
		}
	});

	// Auto-scroll to bottom only when sending/receiving new messages
	function scrollToBottom() {
		if (chatContainer && shouldAutoScroll) {
			setTimeout(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}, 100);
		}
		shouldAutoScroll = true;
	}

	// Save messages to localStorage
	function saveMessages() {
		localStorage.setItem("financeApp_chatMessages", JSON.stringify(messages));
	}

	// Prepare financial data for the API
	function prepareFinancialData() {
		return {
			startingSavings: $startingSavings,
			monthlyOverview: $monthlyData.slice(0, 12).map((month) => ({
				month: month.label,
				total: month.total,
				income: month.income,
				expenses: month.expenses,
				invested: month.invested,
				investmentValue: month.investmentValue,
				netLoans: month.netLoans,
				totalWorth: month.totalWorth,
			})),
			income: $incomeEntries,
			expenses: $expenseEntries,
			investments: $investmentEntries,
			loansGiven: $loansGiven,
			loansTaken: $loansTaken,
			realized: $realizedEntries,
		};
	}

	async function sendMessage() {
		if (!userInput.trim() || isLoading) return;

		const question = userInput.trim();

		// Limit question length to prevent excessive token usage
		if (question.length > 500) {
			errorMessage = "Question is too long. Please keep it under 500 characters.";
			return;
		}

		userInput = "";
		errorMessage = "";

		// Add user message
		messages = [...messages, { role: "user", content: question }];
		saveMessages();
		scrollToBottom();

		isLoading = true;

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					question,
					financialData: prepareFinancialData(),
					conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })), // Send only role/content, exclude widget data
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to get response");
			}

			const data = await response.json();
			let content = data.response;
			let widget = null;

			try {
				// Try to parse as JSON if it looks like JSON
				if (content && content.trim().startsWith("{")) {
					const parsed = JSON.parse(content);
					if (parsed.type === "widget") {
						widget = parsed;
						content = parsed.text || "";
					}
				}
			} catch (e) {
				// Not JSON, treat as plain text
				console.log("Response is not JSON widget data");
			}

			// Add assistant message
			messages = [...messages, { role: "assistant", content, widget }];
			saveMessages();
			scrollToBottom();
		} catch (error) {
			console.error("Error:", error);
			errorMessage = error.message || "Failed to send message. Please try again.";
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function clearChat() {
		messages = [];
		localStorage.removeItem("financeApp_chatMessages");
		errorMessage = "";
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
	<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
		<div>
			<h2 class="text-xl font-semibold text-gray-900">Financial Assistant</h2>
			<p class="text-sm text-gray-600 mt-1">Ask questions about your financial data</p>
		</div>
		{#if messages.length > 0}
			<button
				class="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
				on:click={clearChat}
			>
				Clear Chat
			</button>
		{/if}
	</div>

	<!-- Chat Messages -->
	<div bind:this={chatContainer} class="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
		{#if messages.length === 0}
			<div class="text-center py-12">
				<div class="text-gray-400 mb-4">
					<svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
				<p class="text-gray-600 text-sm max-w-md mx-auto">
					Ask me anything about your finances. I have access to all your income, expenses, loans, and monthly
					overview data.
				</p>
				<div class="mt-6 text-left max-w-md mx-auto">
					<p class="text-sm font-medium text-gray-700 mb-2">Example questions:</p>
					<ul class="text-sm text-gray-600 space-y-1">
						<li>• What's my projected savings in 6 months?</li>
						<li>• Where am I spending the most money?</li>
						<li>• How much do I earn monthly?</li>
						<li>• What are my upcoming loan payments?</li>
					</ul>
				</div>
			</div>
		{/if}

		{#each messages as message}
			<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div
					class="max-w-[80%] rounded-lg px-4 py-3 {message.role === 'user'
						? 'bg-blue-600 text-white'
						: 'bg-white text-gray-900 border border-gray-200'}"
				>
					<p class="text-sm whitespace-pre-wrap">{message.content}</p>
					{#if message.widget}
						<div class="mt-3 mb-1">
							{#if message.widget.widgetType === "pie"}
								<ChatPieChart data={message.widget.data} title={message.widget.title} />
							{:else if message.widget.widgetType === "bar"}
								<ChatBarChart data={message.widget.data} title={message.widget.title} />
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="flex justify-start">
				<div class="bg-white border border-gray-200 rounded-lg px-4 py-3">
					<div class="flex space-x-2">
						<div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
						<div
							class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
							style="animation-delay: 0.2s"
						></div>
						<div
							class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
							style="animation-delay: 0.4s"
						></div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Error Message -->
	{#if errorMessage}
		<div class="bg-red-50 border-t border-red-200 px-6 py-3">
			<p class="text-sm text-red-800">{errorMessage}</p>
		</div>
	{/if}

	<!-- Input Area -->
	<div class="border-t border-gray-200 p-4 bg-white">
		<div class="flex gap-3">
			<div class="flex-1">
				<input
					type="text"
					bind:value={userInput}
					on:keypress={handleKeyPress}
					placeholder="Ask a question about your finances..."
					maxlength="500"
					class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					disabled={isLoading}
				/>
				{#if userInput.length > 400}
					<p class="text-xs text-gray-500 mt-1 text-right">
						{userInput.length}/500 characters
					</p>
				{/if}
			</div>
			<button
				on:click={sendMessage}
				disabled={isLoading || !userInput.trim()}
				class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start"
			>
				{isLoading ? "Sending..." : "Send"}
			</button>
		</div>
	</div>
</div>
