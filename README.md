# CheckMate Pro - Smart Checklist & Task Management Web Application
> **قائمة الأجهزة وتجهيزات المنزل الذكية (استثمار العمر)**

[![Angular 21](https://img.shields.io/badge/Angular-21.0.0-DD0031.svg?logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![Firebase Firestore](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28.svg?logo=firebase)](https://firebase.google.com)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-Platform-4285F4.svg?logo=google-maps)](https://developers.google.com/maps)
[![Gemini AI](https://img.shields.io/badge/Gemini-3.8--Flash-8E75B2.svg?logo=google-gemini)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CheckMate Pro** is a modern, enterprise-grade, offline-first collaborative task and checklist application built with Angular 21 (zoneless, signal-based state management). Originally designed to convert the Arabic Excel bridal and home electrical appliances checklist (**"قائمة الأجهزة الكهربائية - استثمار العمر"**) into a production-ready interactive web application, it combines real-time cloud database syncing, Google Workspace integrations, interactive Google Maps showroom exploration, and a built-in AI Appliance Procurement Advisor powered by Google Gemini.

---

## 🌟 Key Highlights & Core Features

### 1. Interactive Checklist & Budget Management
- **Pre-configured with 12 Core Appliances**: Categorized across *Essential Appliances (الأجهزة الأساسية)*, *Kitchen Appliances (أجهزة المطبخ)*, *Cleaning & Ironing (أجهزة التنظيف والكي)*, and *Kitchen Luxuries (الرفاهية المطبخية)*.
- **Customizable Notes & Showrooms**: Prominent editable notes fields (*ملاحظاتي: ماركة X - معرض Y*) for specifications, warranty terms, and discounts.
- **Financial Tracker**: Dynamic budget estimation vs. actual spend tracking with automated remaining balance indicators and progress meters.
- **Status Lifecycle**: 4 item states: *Not Started (لم يبدأ)*, *In Progress / Comparing (قيد المقارنة)*, *Purchased (تم الشراء)*, and *Delivered (تم التوصيل)*.
- **Priorities & Custom Tags**: Urgency badges (*Urgent*, *High*, *Medium*, *Low*) and filterable multi-tag chips (*#أساسي*, *#مطبخ*, *#انفرتر*).

### 2. Google Workspace & Cloud Integrations
- **Google Sheets**: 1-click export of structured, right-to-left spreadsheet reports with all appliance items, prices, notes, and store selections directly to the user's Google Drive.
- **Google Drive**: Automated cloud backup of JSON checklist snapshots with direct Google Drive view links.
- **Gmail**: Automated sending of styled HTML status and financial reports directly through the Gmail API.
- **Google Calendar**: Real-time synchronization of purchase deadlines and delivery milestones as Google Calendar events with automated notification reminders.

### 3. Google Maps Platform — Showroom Locator
- **Appliance Showroom Map**: Embedded interactive map displaying certified appliance retailers and brand shops (B.Tech, Elaraby Center, Carrefour, Fresh, LG Brand Shop, Raneen).
- **Store Details**: Ratings, phone numbers, operating hours, and active promotional deals.
- **Showroom Linking**: Ability to assign a physical store to any checklist item and open turn-by-turn directions in Google Maps.

### 4. Smart Buying Advisor (Gemini 3.8-Flash)
- Built-in AI engineering consultant powered by `@google/genai` (model: `gemini-3.8-flash`) delivering brand comparisons, inverter technology recommendations, power consumption tips, and market timing guidance directly into task notes.

### 5. Multi-User Collaboration & Real-Time Sync
- **Firebase Firestore**: Real-time cloud persistence with hardened ABAC security rules (`firestore.rules`).
- **Offline-First Resilience**: Seamless local caching (`localStorage`) and automatic background queue reconciliation upon reconnecting.
- **Team Discussion & Rich Comments**: Per-item threaded team comments and file attachment support (receipts, warranties, photos, PDFs).
- **Role-Based Access Control (RBAC)**: Supports *Admin*, *Editor*, and *Viewer* roles with simulated 2FA verification.

### 6. Design & Accessibility
- **Full Bilingual Localization**: Arabic RTL (Cairo typography) and English LTR (Plus Jakarta Sans typography).
- **Dark & Light Mode**: Accessible contrast ratios powered by Tailwind CSS v4.
- **Printable PDF Reports**: Formal printable view with company/family headers, item tables, financial summaries, and signature blocks.
- **Excel CSV Export**: Encoded with UTF-8 Byte Order Mark (`\uFEFF`) to prevent Arabic character corruption in Microsoft Excel.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework**: [Angular 21](https://angular.dev) (Zoneless, Signals, Standalone Components, OnPush Change Detection)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com), [Angular Material Icons](https://material.angular.io)
- **Database & Auth**: [Firebase Firestore](https://firebase.google.com/docs/firestore), [Firebase Auth](https://firebase.google.com/docs/auth) (Google Sign-In)
- **Maps**: [Google Maps JavaScript API](https://developers.google.com/maps), `@angular/google-maps`
- **AI Engine**: [Google Gemini 3.8-Flash](https://ai.google.dev) via `@google/genai`
- **Backend / SSR**: Express 5 on Node.js with Vite Angular Node Engine
- **Testing**: Node.js native test runner (`node:test`) for pure business rules

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.x or later)
- npm (v10.x or later)
- Google Cloud Project with Gemini API and Maps Platform enabled

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/checkmate-pro.git
   cd checkmate-pro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key in `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Tests & Linting**:
   ```bash
   npm test
   npm run lint
   ```

6. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Data Privacy
- Client-side token authentication using OAuth 2.0 with minimal scopes.
- Strict Firestore security rules with zero-trust validation helpers, size guards, and key-diff checking.
- In-memory token management (tokens are never persisted to insecure web storage).

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
Google-sourced snippets are provided under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
