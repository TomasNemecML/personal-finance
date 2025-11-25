# Personal Finance App — Requirements Document

## Overview

A browser-based personal finance tracker that focuses on monthly overview of finances. The main feature is a table of months, starting from the current month, showing total money, difference from last month, and detailed income, expenses, and loans. All data is stored locally (LocalStorage) and recalculates in real-time whenever changes occur.

## Platform

- Browser-based web app
- Single-page application (SPA)
- Frontend-only (no backend required)
- Data persistence via LocalStorage

## Main Features

### 1. Monthly Table

Displays a list of months starting from the current month, extending into the future (e.g., 12 months).

**Columns:**
- Month & Year (e.g., Oct 2025)
- Total Money (calculated as previous month total + income – expenses ± loans)
- Difference from Last Month (change in total money compared to previous month)
- Income (sum of income entries for that month)
- Expenses (sum of expense entries for that month)

Real-time recalculation: any change in income, expenses, or loans updates the table immediately.

### 2. Income

Users can add, edit, and delete income entries.

**Fields per entry:**
- Amount
- Description (optional)
- Date (defaults to the month being edited)

### 3. Expenses

Users can add, edit, and delete expense entries.

**Fields per entry:**
- Amount
- Description (optional)
- Date (defaults to the month being edited)

### 4. Loans

#### a) Loans Given

Two modes: monthly payout or manual payout.

**Fields for monthly payout mode:**
- Start Date
- End Date
- Total Sum
- Monthly Payout (auto-calculated if needed)
- Total to be Received

**Fields for manual payout mode:**
- List of payouts with:
    - Month/Date
    - Amount

#### b) Loans Taken

Same structure as loans given, tracked separately.

All loan payouts affect the total money calculation in the monthly table.

### 5. Data Persistence

- All user data (income, expenses, loans) stored in LocalStorage
- Changes are saved automatically whenever a user edits any field

### 6. Real-Time Recalculation

Any change in income, expenses, or loans triggers recalculation of:
- Monthly total money
- Difference from previous month

The monthly table updates immediately on any data change.
