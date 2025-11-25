import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Data structures
export const incomeEntries = writable([]);
export const expenseEntries = writable([]);
export const loansGiven = writable([]);
export const loansTaken = writable([]);
export const investmentEntries = writable([]);
export const realizedEntries = writable([]);
export const startingSavings = writable(0);
export const portfolioAllocations = writable([]);

// Load data from localStorage
function loadFromStorage(key, defaultValue = []) {
    if (!browser) return defaultValue;
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.error(`Error loading ${key} from localStorage:`, e);
        return defaultValue;
    }
}

// Save data to localStorage
function saveToStorage(key, data) {
    if (!browser) return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e);
    }
}

// Initialize stores with localStorage data
if (browser) {
    incomeEntries.set(loadFromStorage('financeApp_income'));
    expenseEntries.set(loadFromStorage('financeApp_expenses'));
    loansGiven.set(loadFromStorage('financeApp_loansGiven'));
    loansTaken.set(loadFromStorage('financeApp_loansTaken'));
    investmentEntries.set(loadFromStorage('financeApp_investments'));
    realizedEntries.set(loadFromStorage('financeApp_realized', []));
    startingSavings.set(loadFromStorage('financeApp_startingSavings', 0));

    // Migrate old initialInvestmentValue to portfolioAllocations
    const oldInitialInvestment = loadFromStorage('financeApp_initialInvestmentValue', 0);
    let allocations = loadFromStorage('financeApp_portfolioAllocations', []);

    if (oldInitialInvestment > 0 && allocations.length === 0) {
        // Migrate old value to new format
        allocations = [{
            id: Date.now(),
            amount: oldInitialInvestment,
            description: 'Initial Investment',
            annualReturn: 0
        }];
        saveToStorage('financeApp_portfolioAllocations', allocations);
        // Clear old value
        localStorage.removeItem('financeApp_initialInvestmentValue');
    }

    portfolioAllocations.set(allocations);
}

// Auto-save to localStorage when stores change
incomeEntries.subscribe(value => saveToStorage('financeApp_income', value));
expenseEntries.subscribe(value => saveToStorage('financeApp_expenses', value));
loansGiven.subscribe(value => saveToStorage('financeApp_loansGiven', value));
loansTaken.subscribe(value => saveToStorage('financeApp_loansTaken', value));
investmentEntries.subscribe(value => saveToStorage('financeApp_investments', value));
realizedEntries.subscribe(value => saveToStorage('financeApp_realized', value));
startingSavings.subscribe(value => saveToStorage('financeApp_startingSavings', value));
portfolioAllocations.subscribe(value => saveToStorage('financeApp_portfolioAllocations', value));

// Helper functions
export function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function parseMonthKey(monthKey) {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
}

export function getNextMonths(count = 12) {
    const months = [];
    const now = new Date();
    const current = new Date(now.getFullYear(), now.getMonth(), 1);

    for (let i = 0; i < count; i++) {
        const month = new Date(current.getFullYear(), current.getMonth() + i, 1);
        months.push({
            key: getMonthKey(month),
            date: month,
            label: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
            isCurrentMonth: i === 0
        });
    }
    return months;
}

// Calculate loan principals received in a specific month (when loan starts)
function calculateLoanPrincipals(loans, monthKey, isCurrentMonth = false, realized = []) {
    let totalPrincipals = 0;
    const today = new Date();

    loans.forEach(loan => {
        const startDate = new Date(loan.startDate || loan.date);
        const startMonthKey = getMonthKey(startDate);

        // Check if this loan starts in this month
        if (startMonthKey === monthKey) {
            // Check realized
            if (isCurrentMonth && realized.includes(`${loan.id}_${monthKey}`)) return;

            // For all months, include if it starts in this month
            const principal = parseFloat(loan.principalAmount || loan.totalSum) || 0;
            totalPrincipals += principal;
        }
    });

    return totalPrincipals;
}

// Calculate loan payouts for a specific month
function calculateLoanPayouts(loans, monthKey, isCurrentMonth = false, realized = []) {
    let totalPayouts = 0;
    const today = new Date();

    loans.forEach(loan => {
        if (loan.mode === 'monthly') {
            const loanMonth = parseMonthKey(monthKey);
            const startDate = new Date(loan.startDate);
            const endDate = new Date(loan.endDate);
            const recurringDay = startDate.getDate();

            const startMonthKey = getMonthKey(startDate);

            // Calculate the first payment month (month after start date)
            const firstPaymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
            const firstPaymentMonthKey = getMonthKey(firstPaymentDate);

            // Calculate the last payment month (same as end date since payments start one month after loan)
            const lastPaymentMonthKey = getMonthKey(endDate);

            // Check if month is in range (payments start the month AFTER the loan starts and continue through end date)
            if (monthKey >= firstPaymentMonthKey && monthKey <= lastPaymentMonthKey) {
                // Check realized
                if (isCurrentMonth && realized.includes(`${loan.id}_${monthKey}`)) return;

                // For all months in the view, always include
                totalPayouts += parseFloat(loan.monthlyPayout) || 0;
            }
        } else if (loan.mode === 'manual') {
            // Check realized for the whole loan in this month
            if (isCurrentMonth && realized.includes(`${loan.id}_${monthKey}`)) return;

            const monthPayouts = loan.payouts?.filter(payout => {
                const payoutDate = new Date(payout.date);
                const payoutMonthKey = getMonthKey(payoutDate);

                // Check if payout is in this month
                if (payoutMonthKey !== monthKey) {
                    return false;
                }

                // For all months, include all payouts in this month
                return true;
            }) || [];

            const payoutTotal = monthPayouts.reduce((sum, payout) => {
                const amount = parseFloat(payout.amount) || 0;
                return sum + amount;
            }, 0);

            totalPayouts += payoutTotal;
        }
    });

    return totalPayouts;
}

// Derived store for monthly calculations
export const monthlyData = derived(
    [incomeEntries, expenseEntries, loansGiven, loansTaken, investmentEntries, startingSavings, realizedEntries, portfolioAllocations],
    ([$income, $expenses, $loansGiven, $loansTaken, $investments, $startingSavings, $realized, $portfolioAllocations]) => {
        const months = getNextMonths(100);
        let previousTotal = $startingSavings;

        // Track accumulated investment value per investment ID
        // Map<investmentId, currentValue>
        let investmentValues = new Map();

        // Track accumulated portfolio allocation values
        // Map<allocationId, currentValue>
        let portfolioValues = new Map();

        // Initialize portfolio values
        $portfolioAllocations.forEach(allocation => {
            portfolioValues.set(allocation.id, allocation.amount);
        });

        return months.map((month, index) => {
            const today = new Date();
            const isCurrentMonth = month.isCurrentMonth;
            const isRealized = (id) => $realized.includes(`${id}_${month.key}`);

            // Calculate income for this month
            // One-time income: only counts in the specific month
            const oneTimeIncomeEntries = $income.filter(entry => (entry.type === 'one-time' || !entry.type) && getMonthKey(new Date(entry.date)) === month.key);
            const oneTimeIncome = oneTimeIncomeEntries.reduce((sum, entry) => {
                if (isCurrentMonth && isRealized(entry.id)) return sum;
                return sum + entry.amount;
            }, 0);

            // Monthly income: counts in this month and all future months if start date is before or in this month
            const monthlyIncomeEntries = $income.filter(entry => {
                if (entry.type !== 'monthly') return false;
                const entryDate = new Date(entry.date);
                const startMonthKey = getMonthKey(entryDate);

                // If the recurring item starts in a future month, don't include it
                if (month.key < startMonthKey) {
                    return false;
                }

                // Check realized
                if (isCurrentMonth && isRealized(entry.id)) return false;

                // For all months (including current), include if month is in range
                return month.key >= startMonthKey;
            });
            const monthlyIncome = monthlyIncomeEntries.reduce((sum, entry) => sum + entry.amount, 0);

            const monthIncome = oneTimeIncome + monthlyIncome;

            // Calculate expenses for this month
            // One-time expense: only counts in the specific month
            const oneTimeExpensesEntries = $expenses.filter(entry => (entry.type === 'one-time' || !entry.type) && getMonthKey(new Date(entry.date)) === month.key);
            const oneTimeExpenses = oneTimeExpensesEntries.reduce((sum, entry) => {
                if (isCurrentMonth && isRealized(entry.id)) return sum;
                return sum + entry.amount;
            }, 0);

            // Monthly expense: counts in this month and all future months if start date is before or in this month
            const monthlyExpensesEntries = $expenses.filter(entry => {
                if (entry.type !== 'monthly') return false;
                const entryDate = new Date(entry.date);
                const startMonthKey = getMonthKey(entryDate);

                // If the recurring item starts in a future month, don't include it
                if (month.key < startMonthKey) {
                    return false;
                }

                // Check realized
                if (isCurrentMonth && isRealized(entry.id)) return false;

                // For all months (including current), include if month is in range
                return month.key >= startMonthKey;
            });
            const monthlyExpenses = monthlyExpensesEntries.reduce((sum, entry) => sum + entry.amount, 0);

            const monthExpenses = oneTimeExpenses + monthlyExpenses;

            // Calculate Investments (treated as expenses for cash flow)
            let monthInvestedAmount = 0;

            // Process investments for this month
            $investments.forEach(inv => {
                const entryDate = new Date(inv.date);
                const startMonthKey = getMonthKey(entryDate);
                const annualRate = parseFloat(inv.annualReturn) || 0;
                const monthlyRate = annualRate / 100 / 12;

                let contribution = 0;
                let cashFlowContribution = 0;

                if (inv.type === 'one-time') {
                    if (startMonthKey === month.key) {
                        contribution = parseFloat(inv.amount);
                        if (!(isCurrentMonth && isRealized(inv.id))) {
                            cashFlowContribution = contribution;
                        }
                    }
                } else if (inv.type === 'monthly') {
                    if (month.key >= startMonthKey) {
                        contribution = parseFloat(inv.amount);
                        if (!(isCurrentMonth && isRealized(inv.id))) {
                            cashFlowContribution = contribution;
                        }
                    }
                }

                monthInvestedAmount += cashFlowContribution;

                // Update accumulated value
                // 1. Apply growth to existing value from previous month
                let currentValue = investmentValues.get(inv.id) || 0;

                // Only apply growth if the investment has started
                if (month.key >= startMonthKey) {
                    // Add growth
                    currentValue = currentValue * (1 + monthlyRate);

                    // Add new contribution (Asset value always includes contribution, even if realized)
                    currentValue += contribution;
                }

                investmentValues.set(inv.id, currentValue);
            });

            // Apply growth to portfolio allocations
            $portfolioAllocations.forEach(allocation => {
                const annualRate = parseFloat(allocation.annualReturn) || 0;
                const monthlyRate = annualRate / 100 / 12;

                let currentValue = portfolioValues.get(allocation.id) || 0;
                // Apply monthly growth (skip for the first month - index 0)
                if (index > 0) {
                    currentValue = currentValue * (1 + monthlyRate);
                }
                portfolioValues.set(allocation.id, currentValue);
            });

            const totalInvestmentValue = Array.from(investmentValues.values()).reduce((sum, val) => sum + val, 0);
            const totalPortfolioValue = Array.from(portfolioValues.values()).reduce((sum, val) => sum + val, 0);
            const combinedInvestmentValue = totalInvestmentValue + totalPortfolioValue;


            // Calculate loan principals (money received when taking a loan, or given when lending)
            const loanPrincipalsGiven = calculateLoanPrincipals($loansGiven, month.key, isCurrentMonth, $realized);
            const loanPrincipalsTaken = calculateLoanPrincipals($loansTaken, month.key, isCurrentMonth, $realized);

            // Calculate loan payouts (positive = money received back, negative = money paid back)
            const loansReceived = calculateLoanPayouts($loansGiven, month.key, isCurrentMonth, $realized);
            const loansPaid = calculateLoanPayouts($loansTaken, month.key, isCurrentMonth, $realized);

            // Net loans calculation:
            // When you GIVE a loan: principal goes out (-), payouts come in (+)
            // When you TAKE a loan: principal comes in (+), payouts go out (-)
            const netLoans = loanPrincipalsTaken - loanPrincipalsGiven + loansReceived - loansPaid;

            // Calculate total for this month
            // Investments are subtracted as they are cash outflows
            const currentTotal = previousTotal + monthIncome - monthExpenses - monthInvestedAmount + netLoans;
            const difference = currentTotal - previousTotal;
            const totalWorth = currentTotal + combinedInvestmentValue;

            const result = {
                ...month,
                income: monthIncome,
                expenses: monthExpenses,
                invested: monthInvestedAmount,
                investmentValue: combinedInvestmentValue,
                loanPrincipalsGiven,
                loanPrincipalsTaken,
                loansReceived,
                loansPaid,
                netLoans,
                total: currentTotal,
                difference,
                totalWorth
            };

            previousTotal = currentTotal;
            return result;
        });
    }
);

// Function to get all entries for a specific month
export function getMonthDetails(monthKey, income, expenses, loansGiven, loansTaken, investments) {
    const monthDate = parseMonthKey(monthKey);
    const today = new Date();
    const isCurrentMonth = getMonthKey(today) === monthKey;

    // Get income entries
    const monthIncomes = income.filter(entry => {
        if (entry.type === 'monthly') {
            const entryDate = new Date(entry.date);
            const startMonthKey = getMonthKey(entryDate);

            if (monthKey < startMonthKey) return false;

            return monthKey >= startMonthKey;
        } else {
            return getMonthKey(new Date(entry.date)) === monthKey;
        }
    });

    // Get expense entries
    const monthExpenses = expenses.filter(entry => {
        if (entry.type === 'monthly') {
            const entryDate = new Date(entry.date);
            const startMonthKey = getMonthKey(entryDate);

            if (monthKey < startMonthKey) return false;

            return monthKey >= startMonthKey;
        } else {
            return getMonthKey(new Date(entry.date)) === monthKey;
        }
    });

    // Get investment entries (contributions for this month)
    const monthInvestments = investments ? investments.filter(entry => {
        if (entry.type === 'monthly') {
            const entryDate = new Date(entry.date);
            const startMonthKey = getMonthKey(entryDate);

            if (monthKey < startMonthKey) return false;

            return monthKey >= startMonthKey;
        } else {
            return getMonthKey(new Date(entry.date)) === monthKey;
        }
    }) : [];

    // Get loan entries
    const monthLoansGiven = [];
    const monthLoansTaken = [];

    loansGiven.forEach(loan => {
        const startDate = new Date(loan.startDate);
        const startMonthKey = getMonthKey(startDate);
        const isPrincipalMonth = startMonthKey === monthKey;

        if (loan.mode === 'monthly') {
            const endDate = new Date(loan.endDate);
            const endMonthKey = getMonthKey(endDate);

            if (monthKey >= startMonthKey && monthKey <= endMonthKey) {
                monthLoansGiven.push({ ...loan, isPrincipalMonth });
            }
        } else if (loan.mode === 'manual') {
            const hasPayoutInMonth = loan.payouts?.some(payout => {
                const payoutMonthKey = getMonthKey(new Date(payout.date));
                return payoutMonthKey === monthKey;
            });
            if (hasPayoutInMonth || isPrincipalMonth) {
                monthLoansGiven.push({ ...loan, isPrincipalMonth });
            }
        }
    });

    loansTaken.forEach(loan => {
        const startDate = new Date(loan.startDate);
        const startMonthKey = getMonthKey(startDate);
        const isPrincipalMonth = startMonthKey === monthKey;

        if (loan.mode === 'monthly') {
            const endDate = new Date(loan.endDate);
            const endMonthKey = getMonthKey(endDate);

            if (monthKey >= startMonthKey && monthKey <= endMonthKey) {
                monthLoansTaken.push({ ...loan, isPrincipalMonth });
            }
        } else if (loan.mode === 'manual') {
            const hasPayoutInMonth = loan.payouts?.some(payout => {
                const payoutMonthKey = getMonthKey(new Date(payout.date));
                return payoutMonthKey === monthKey;
            });
            if (hasPayoutInMonth || isPrincipalMonth) {
                monthLoansTaken.push({ ...loan, isPrincipalMonth });
            }
        }
    });

    return {
        income: monthIncomes,
        expenses: monthExpenses,
        investments: monthInvestments,
        loansGiven: monthLoansGiven,
        loansTaken: monthLoansTaken
    };
}

// Helper functions for CRUD operations
export const financeActions = {
    addIncome: (amount, description = '', date = new Date(), type = 'one-time') => {
        incomeEntries.update(entries => [...entries, {
            id: Date.now(),
            amount: Number(amount),
            description,
            date: date.toISOString().split('T')[0],
            type
        }]);
    },

    updateIncome: (id, updates) => {
        incomeEntries.update(entries =>
            entries.map(entry => entry.id === id ? { ...entry, ...updates } : entry)
        );
    },

    deleteIncome: (id) => {
        incomeEntries.update(entries => entries.filter(entry => entry.id !== id));
    },

    addExpense: (amount, description = '', date = new Date(), type = 'one-time') => {
        expenseEntries.update(entries => [...entries, {
            id: Date.now(),
            amount: Number(amount),
            description,
            date: date.toISOString().split('T')[0],
            type
        }]);
    },

    updateExpense: (id, updates) => {
        expenseEntries.update(entries =>
            entries.map(entry => entry.id === id ? { ...entry, ...updates } : entry)
        );
    },

    deleteExpense: (id) => {
        expenseEntries.update(entries => entries.filter(entry => entry.id !== id));
    },

    addInvestment: (amount, description = '', date = new Date(), type = 'one-time', annualReturn = 0) => {
        investmentEntries.update(entries => [...entries, {
            id: Date.now(),
            amount: Number(amount),
            description,
            date: date.toISOString().split('T')[0],
            type,
            annualReturn: Number(annualReturn)
        }]);
    },

    updateInvestment: (id, updates) => {
        investmentEntries.update(entries =>
            entries.map(entry => entry.id === id ? { ...entry, ...updates } : entry)
        );
    },

    deleteInvestment: (id) => {
        investmentEntries.update(entries => entries.filter(entry => entry.id !== id));
    },

    addLoanGiven: (loan) => {
        loansGiven.update(loans => [...loans, {
            id: Date.now(),
            ...loan
        }]);
    },

    updateLoanGiven: (id, updates) => {
        loansGiven.update(loans =>
            loans.map(loan => loan.id === id ? { ...loan, ...updates } : loan)
        );
    },

    deleteLoanGiven: (id) => {
        loansGiven.update(loans => loans.filter(loan => loan.id !== id));
    },

    addLoanTaken: (loan) => {
        loansTaken.update(loans => [...loans, {
            id: Date.now(),
            ...loan
        }]);
    },

    updateLoanTaken: (id, updates) => {
        loansTaken.update(loans =>
            loans.map(loan => loan.id === id ? { ...loan, ...updates } : loan)
        );
    },

    deleteLoanTaken: (id) => {
        loansTaken.update(loans => loans.filter(loan => loan.id !== id));
    },

    toggleRealized: (id, monthKey) => {
        realizedEntries.update(entries => {
            const key = `${id}_${monthKey}`;
            if (entries.includes(key)) {
                return entries.filter(k => k !== key);
            } else {
                return [...entries, key];
            }
        });
    },

    addPortfolioAllocation: (amount, description = '', annualReturn = 0) => {
        portfolioAllocations.update(allocations => [...allocations, {
            id: Date.now(),
            amount: Number(amount),
            description,
            annualReturn: Number(annualReturn)
        }]);
    },

    updatePortfolioAllocation: (id, updates) => {
        portfolioAllocations.update(allocations =>
            allocations.map(allocation => allocation.id === id ? { ...allocation, ...updates } : allocation)
        );
    },

    deletePortfolioAllocation: (id) => {
        portfolioAllocations.update(allocations => allocations.filter(allocation => allocation.id !== id));
    }
};

// Export/Import functions
export function exportAllData() {
    if (!browser) return;

    const data = {
        incomeEntries: loadFromStorage('financeApp_income'),
        expenseEntries: loadFromStorage('financeApp_expenses'),
        loansGiven: loadFromStorage('financeApp_loansGiven'),
        loansTaken: loadFromStorage('financeApp_loansTaken'),
        investmentEntries: loadFromStorage('financeApp_investments'),
        realizedEntries: loadFromStorage('financeApp_realized', []),
        startingSavings: loadFromStorage('financeApp_startingSavings', 0),
        portfolioAllocations: loadFromStorage('financeApp_portfolioAllocations', []),
        exportDate: new Date().toISOString(),
        version: '1.2'
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function importAllData(file) {
    if (!browser) return Promise.reject('Not in browser environment');

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate data structure
                if (!data.incomeEntries || !data.expenseEntries || !data.loansGiven || !data.loansTaken) {
                    throw new Error('Invalid data format');
                }

                // Update stores
                incomeEntries.set(data.incomeEntries);
                expenseEntries.set(data.expenseEntries);
                loansGiven.set(data.loansGiven);
                loansTaken.set(data.loansTaken);
                investmentEntries.set(data.investmentEntries || []);
                realizedEntries.set(data.realizedEntries || []);
                startingSavings.set(data.startingSavings || 0);

                // Handle portfolio allocations with migration
                let allocations = data.portfolioAllocations || [];
                if (data.initialInvestmentValue && data.initialInvestmentValue > 0 && allocations.length === 0) {
                    // Migrate old format
                    allocations = [{
                        id: Date.now(),
                        amount: data.initialInvestmentValue,
                        description: 'Initial Investment',
                        annualReturn: 0
                    }];
                }
                portfolioAllocations.set(allocations);

                resolve({ success: true, message: 'Data imported successfully!' });
            } catch (error) {
                reject({ success: false, message: `Import failed: ${error.message}` });
            }
        };

        reader.onerror = () => {
            reject({ success: false, message: 'Failed to read file' });
        };

        reader.readAsText(file);
    });
}