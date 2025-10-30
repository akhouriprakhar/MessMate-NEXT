# MessMate NEXT 🍽️

> **Eat. Track. Relax.**
>
> The next generation of mess management, built for humans — not spreadsheets.

MessMate NEXT is a modern, responsive Progressive Web App (PWA) designed to help users track their daily mess (dining hall) meals. It simplifies meal management with a 30-day cycle system, detailed statistics, financial calculations, and PDF report generation.

## ✨ Features

  * **Daily Meal Tracking:** Easily track Breakfast, Lunch, and Dinner.
  * **Flexible Statuses:** Cycle through four distinct meal statuses:
      * ✅ **Taken:** You had the meal.
      * ❌ **Missed:** You cancelled the meal.
      * ⚠️ **Owner:** The mess owner cancelled the meal.
      * ⏺️ **Pending:** Default status.
  * **Detailed Statistics:** Get a complete overview of your cycle, including total meals, taken, missed, and owner-cancelled counts, all visualized in a pie chart.
  * **Financial Reports:** Automatically calculates the money you saved or the extra amount you owe based on your per-meal rate and monthly fee.
  * **PDF Downloads:** Generate and download a complete monthly report with a daily log and financial summary using jsPDF.
  * **PWA Ready:** Installable as a standalone app on your phone or desktop with offline support, thanks to its service worker.
  * **Data Management:** Securely **Backup** your app data to a JSON file and **Restore** it anytime.
  * **Light & Dark Mode:** Automatically switches themes and includes a manual toggle for your preference.
  * **Responsive Design:** Works beautifully on all devices, from mobile phones to desktops.

## 🚀 Getting Started

MessMate NEXT is a static web app and requires no backend.

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
    ```
2.  **Open the app:**
      * Simply open the `MM2.0/index.html` file in your web browser.
      * Or, deploy the `MM2.0` folder to any static site host like Netlify, Vercel, or GitHub Pages.

### Initial Setup

On first launch, the app will ask for:

  * Your Name
  * Mess Name
  * Cycle Start Date
  * Monthly Rate
  * Per Meal Rate (can be auto-calculated)

Once set up, your 30-day meal cycle is generated, and you're ready to start tracking\!

## 🔧 Tech Stack

  * **Frontend:** HTML5, CSS3 (with CSS Variables), Vanilla JavaScript
  * **Charting:** [Chart.js](https://www.chartjs.org/)
  * **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF)
  * **PWA:** Service Workers, `manifest.json`

## ☁️ Deployment

This app is built to be deployed on any static web host.

### Netlify

For deploying to Netlify, this repository already includes a `_redirects` file in the `MM2.0` folder to handle SPA routing.

**`MM2.0/_redirects`**

```
/* /index.html    200
```

**Build Settings:**

  * **Publish directory:** `MM2.0`
  * **Build command:** (leave blank)
