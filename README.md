# Yonder Points Optimizer

A lightweight tool for finding the best value redemptions with your Yonder credit card points. Compare redemption rates across different experiences and card tiers to maximize your points' value.

## 🚀 Features

- **Multi-tier Support**: Compare rates across Free, Paid, and Premium Yonder card tiers
- **City-based Filtering**: Browse experiences available in your city (London, Manchester, Birmingham, Leeds)
- **Personalized Settings**: Save your card type and city preferences with automatic persistence
- **Best Value Highlighting**: Automatically identifies and badges the best redemption opportunities based on dynamic thresholds.
- **Category Filtering**: Browse experiences by category (Dining, Travel, Shopping, etc.)
- **Top 3 Rankings**: Showcases the best overall redemption rates for your location
- **Mobile Optimized**: Responsive design with mobile-specific layouts
- **Real-time Data**: Pulls live data from Airtable for up-to-date redemption rates

## 🛠️ Tech Stack

- **Framework**: Next.js 15.4.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Airtable
- **Storage**: LocalStorage for user preferences
- **Deployment**: Vercel
- **UI Components**: Custom React components with interactive features

## 🎯 User Experience

- **Smart Defaults**: London location and Credit Paid card pre-selected for optimal experience
- **Guided Setup**: New users get a welcome flow to set their preferences
- **Instant Filtering**: Real-time filtering by category and city with smooth transitions

## 🏗️ Architecture

- **Data Structure**: City-specific experience records in Airtable for flexible pricing
- **State Management**: React hooks with localStorage persistence
- **Dynamic Content**: City list automatically extracted from available data
- **Performance Optimized**: Efficient filtering and memoized calculations

## 📊 Data Model

- **Experiences**: Each experience record includes city, category, and redemption tiers
- **Multi-city Support**: Same experience can have different rates across cities
- **Monthly Updates**: Content automatically filtered by current month
- **Flexible Tiers**: Support for multiple redemption levels per experience

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
