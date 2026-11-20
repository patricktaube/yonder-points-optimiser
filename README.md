# Yonder Points Optimiser

A lightweight tool for finding the best-value redemptions for your Yonder credit card points. It compares redemption rates across experiences for your city and card type.

## 🚀 Features

- **Card types**: Debit Free, Debit Paid, Credit Free and Credit Paid, each with its own earn rate (`CARD_TYPES` in `app/lib/experiences.ts`)
- **City filtering**: London, Birmingham, Bristol & Bath, Edinburgh and Manchester (taken from the Sheet's `lists` tab)
- **Saved settings**: card type and city are stored in the browser (localStorage)
- **Points balance**: type a balance (or pick 5k/10k/25k/50k) to see what you can get now and how many points you need for the rest; optionally hide anything out of reach
- **Labels**: "Great value" (15%+ above the city average) and "Poor value" (20%+ below), comparing £ per 10,000 points
- **Leaderboard and categories**: the five best rates in your city, plus every experience by category, best value first
- **Month label**: shows which month the rates are for (the latest month in the Sheet)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Data**: private Google Sheet, read with a service account (no extra npm packages)
- **Deployment**: Vercel

## 🏗️ Architecture

- `app/lib/sheets.ts` (server only): signs a service-account JWT with Node's `crypto`, fetches the Sheet in one `values:batchGet` call, and parses and validates the rows.
- `app/lib/experiences.ts`: the `Experience` type, card types, category order/icons, value maths and badge logic. Safe to import from client components.
- `app/page.tsx`: static page with **ISR**, regenerated at most hourly (`revalidate = 3600`). It sends only the latest month's experiences to the browser. If the Sheet can't be read during regeneration, the last good page keeps being served. If it can't be read at build time, the build fails.
- `app/components/ExperiencesList.tsx`: the page: balance input, leaderboard, category filter and category cards. Responsive: one set of markup that switches from the phone layout to the desktop layout at Tailwind's `lg` breakpoint (1024px).
- `app/components/ExperienceCard.tsx`: one experience (a row on phones, a tile on desktop).
- `app/components/SettingsMenu.tsx`: the city/card pill and its panel (bottom sheet on phones), including the first-visit welcome.

## 📊 Data Model

- One row per experience per month. Past months stay in the Sheet as history.
- Each row stores only the **middle tier** (points and £). Yonder's tiers are 1×/2×/4× of the same rate, so one pair is enough: the site works out the small tier (half) and the large tier (double) itself.
- `£ per 10,000 points = pounds / points × 10000` (the headline number on the site)
- `£ per 1,000 points = pounds / points × 1000`
- `return % = pounds / (points / card's points per £) × 100`

## 📝 Data: Google Sheet

Rates live in a **private** Google Sheet. The site reads it through the Google Sheets API using a service account with Viewer access. There is no public link.

### Tab `data` (one row per experience per month)

The site reads columns A–F. Row 1 is the header.

| Col | Header | Example | Validation / formula (row 2, fill down) |
|---|---|---|---|
| A | month | `2025-11` | Format the column as **Plain text** first (Format → Number → Plain text), or Sheets turns it into a date. Validation: custom formula `=REGEXMATCH(TO_TEXT(A2), "^\d{4}-\d{2}$")`, reject input |
| B | experience | `Angel Gyms` | none |
| C | category | `Fit&Well` | Dropdown (from a range): `=lists!$A$2:$A` |
| D | cities | `All` or `London, Manchester` | Free text. `All` = every city in `lists!B`. |
| E | points | `35340` | Middle tier points. Validation: number greater than 0 |
| F | pounds | `160` | Middle tier £ value. Validation: number greater than 0 |
| G | rate_per_1k | (formula) | `=IF(AND(ISNUMBER(E2), ISNUMBER(F2), E2>0), F2/E2*1000, "")` |
| H | check | (formula) | see below |

Check formula for **H2** (shows ⚠️ text when something looks wrong, otherwise blank):

```
=IF(B2="", "", TRIM(
  IF(COUNTIFS($A:$A, A2, $B:$B, B2) > 1, "⚠️ duplicate ", "") &
  IF(OR(A2="", C2="", D2="", E2="", F2=""), "⚠️ missing value ", "") &
  IF(AND(ISNUMBER(E2), ISNUMBER(F2), E2>0),
     IF(OR(F2/E2*1000 < 1, F2/E2*1000 > 8), "⚠️ rate outside £1–£8 ", ""),
     IF(AND(E2<>"", F2<>""), "⚠️ points/pounds not numbers ", ""))
))
```

Columns G and H are for your reference only. The site recalculates the rate itself and ignores anything past column F.

Optional extras: View → Freeze → 1 row, and a filter view per month.

### Tab `lists`

| A (category) | B (city) |
|---|---|
| Dining | London |
| Entertainment | Birmingham |
| Fit&Well | Bristol & Bath |
| Lounges | Edinburgh |
| Shopping | Manchester |
| Travel | |

The site reads `lists!B2:B` to expand `All`. Adding a new city there makes it part of `All` for every month, including past ones.

### Monthly update

Add one row per experience with that month's `YYYY-MM`, the middle tier's points and £ value, and check that column H is blank. The site picks up the latest month within an hour.

### One-time Google Cloud setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project (free), then open **APIs & Services → Library** and enable the **Google Sheets API**.
2. Go to **IAM & Admin → Service Accounts → Create service account**. Give it any name (e.g. `yonder-sheet-reader`), skip the optional roles, and click Done.
3. Open the service account → **Keys → Add key → Create new key → JSON**. A `.json` file downloads. Treat it like a password.
4. In the Sheet, click **Share**, paste the service account's `client_email` (from the JSON) and give it **Viewer** access. Untick "Notify".
5. Add these environment variables in Vercel (tick **Production and Preview**) and in `.env.local`:

   | Variable | Value |
   |---|---|
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON |
   | `GOOGLE_PRIVATE_KEY` | `private_key` from the JSON, pasted as-is including the `\n`s. The code converts them to real line breaks. |
   | `GOOGLE_SHEET_ID` | The long ID in the Sheet URL: `docs.google.com/spreadsheets/d/<THIS PART>/edit` |

   In `.env.local`, wrap the key in double quotes: `GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"`. In Vercel, paste it without quotes.
6. Delete the downloaded JSON file once the variables are saved. If it leaks, delete the key in Google Cloud and create a new one.
