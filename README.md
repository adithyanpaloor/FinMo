# FinMo — Personal Finance Monitor

React 19 + TypeScript + Vite + Tailwind + Firebase (Auth, Firestore, Storage).

Track income/expenses/transfers, accounts, budgets, goals, investments and recurring
payments; view analytics; export CSV, print a PDF summary, import CSV.

## Setup

```bash
npm install
cp .env.example .env        # fill in your Firebase web-app config
npm run dev                 # http://localhost:5173
npm run build               # type-check + production build
```

### Firebase (one-time)
1. Create a project at https://console.firebase.google.com
2. **Authentication → Sign-in method → Email/Password → Enable**
3. **Firestore Database → Create database**
4. (Optional, for receipt uploads) **Storage → Get started** (requires the Blaze plan)
5. Deploy security rules so users can only access their own data:
   ```bash
   npm i -g firebase-tools && firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules,storage
   ```
6. Optional hosting: `npm run build && firebase deploy --only hosting`

> `.env` holds your project config and is git-ignored. Firebase web keys are not secret,
> but **the security rules are what protect your data — deploy them.**

## Data model
`users/{uid}` profile · `users/{uid}/{accounts|transactions|budgets|goals|investments|recurringPayments}`

Account balances are updated atomically (Firestore transactions) whenever a transaction
is added, edited or deleted. Adding an investment creates a linked `investment`
transaction that debits the chosen account.

## CSV import format
Same columns as the export: `Date, Type, Amount, Category, Merchant, Account, Payment Method, Description, Tags`
(`Account` must match an existing account name; transfers can't be imported).
