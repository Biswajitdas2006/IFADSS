# IFADSS frontend

The React application for the Intelligent Financial Automation and Decision Support System. It provides public sign-in and registration pages and an authenticated workspace for invoice processing, transaction review, anomaly review, forecasting, and account settings.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run lint` to check the frontend and `npm run build` to create the production bundle.

## Workspace

- **Invoices:** upload PDF, JPG, or PNG files up to 10 MB and review extraction status and line items.
- **Transactions:** review invoice-derived records, model confidence, and editable categories.
- **Anomalies:** available to Owner and Accountant roles for scanning, filtering, and recording reviews.
- **Predictions:** Owner and Accountant roles can explore revenue, expense, or cash-flow forecasts for supported horizons.
- **Settings:** view account details and sign out. Profile editing and password management are not available in this version.

Financial amounts are displayed in Indian rupees (INR). Forecasts are estimates; anomaly flags require human review.
