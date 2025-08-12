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