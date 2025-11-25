import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

export async function POST({ request }) {
    try {
        const { question, financialData, conversationHistory = [] } = await request.json();

        if (!question || !financialData) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!OPENAI_API_KEY) {
            return json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        // Prepare the system message with financial data
        const systemMessage = `You are a helpful financial assistant. You have access to the user's personal finance data and can answer questions about it.

Here is the user's financial data:

### General
- Starting Savings: €${financialData.startingSavings}
- Initial Investment Value: €${financialData.initialInvestmentValue}

### Monthly Overview (Next 12 Months)
| Month | Total Cash | Income | Expenses | Invested | Inv. Value | Net Loans | Total Worth |
|-------|------------|--------|----------|----------|------------|-----------|-------------|
${financialData.monthlyOverview.map(m => `| ${m.month} | €${m.total} | €${m.income} | €${m.expenses} | €${m.invested} | €${m.investmentValue} | €${m.netLoans} | €${m.totalWorth} |`).join('\n')}

### Income Entries
${financialData.income.map(i => `- ${i.description || 'Income'}: €${i.amount} (${i.type}, ${i.date})`).join('\n')}

### Expense Entries
${financialData.expenses.map(e => `- ${e.description || 'Expense'}: €${e.amount} (${e.type}, ${e.date})`).join('\n')}

### Investment Entries
${financialData.investments.map(i => `- ${i.description || 'Investment'}: €${i.amount} (${i.type}, ${i.date}, ${i.annualReturn}% return)`).join('\n')}

### Loans Given
${financialData.loansGiven.map(l => `- To ${l.person}: Total €${l.totalAmount}, Mode: ${l.mode}${l.mode === 'monthly' ? `, Monthly: €${l.monthlyPayout}` : ''}`).join('\n')}

### Loans Taken
${financialData.loansTaken.map(l => `- From ${l.person}: Total €${l.totalAmount}, Mode: ${l.mode}${l.mode === 'monthly' ? `, Monthly: €${l.monthlyPayout}` : ''}`).join('\n')}

### Realized Transactions (Already Happened)
${financialData.realized.length > 0 ? financialData.realized.join(', ') : 'None'}

Provide helpful, accurate, and concise answers about the user's finances. Use the currency format with € symbol. Be friendly and supportive.

IMPORTANT LOGIC RULES:
1. **Total Worth** = Cash Savings + Investment Value.
2. **Loans Given**: This is money the user LENT to others.
   - The initial "Total" amount was an OUTFLOW (money left the user).
   - The "Monthly" payouts are INFLOWS (money coming BACK to the user). DO NOT count these as expenses. They are effectively income/repayments.
3. **Loans Taken**: This is money the user BORROWED from others.
   - The initial "Total" amount was an INFLOW (money received).
   - The "Monthly" payouts are OUTFLOWS (expenses/repayments).
4. **Investments**: Contributions are outflows from cash, but they increase Net Worth.

VISUALIZATION RULES:
If the user asks for a breakdown, trend, or comparison that is best shown visually, you MUST respond with a JSON object in the following format (do not wrap in markdown code blocks, just raw JSON):

{
  "type": "widget",
  "widgetType": "pie" | "bar",
  "title": "Chart Title",
  "data": {
    "labels": ["Label1", "Label2"],
    "datasets": [{ "label": "Dataset Label", "data": [10, 20], "backgroundColor": ["#color1", "#color2"] }]
  },
  "text": "A brief explanation of the chart."
}

For "pie" charts, use these colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].
For "bar" charts, use '#3b82f6' for the background color.

If no visualization is needed, just respond with plain text.`;

        // Build conversation messages with history
        const messages = [
            { role: 'system', content: systemMessage },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: question }
        ];

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            messages,
        });

        const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

        return json({ response });
    } catch (error) {
        console.error('OpenAI API Error:', error);

        // Handle specific OpenAI errors
        if (error.status === 401) {
            return json({ error: 'Invalid API key. Please check your OpenAI API key configuration.' }, { status: 500 });
        }

        if (error.status === 429) {
            return json({ error: 'Rate limit exceeded. Please wait a moment and try again.' }, { status: 429 });
        }

        if (error.status === 400) {
            return json({ error: 'Invalid request. Please try rephrasing your question.' }, { status: 400 });
        }

        return json({
            error: error.message || 'Failed to process your request. Please try again.'
        }, { status: 500 });
    }
}
