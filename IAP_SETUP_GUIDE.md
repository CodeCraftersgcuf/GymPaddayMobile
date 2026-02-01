# Apple In-App Purchase Setup Guide for GymPaddy

## Overview
The app now uses Apple In-App Purchase (IAP) for iOS top-up/deposit functionality instead of Flutterwave. The minimum purchase amount is 100 Naira.

## Product Configuration in App Store Connect

You need to create **ONE consumable in-app purchase product** in App Store Connect.

### Single Product Setup (Current Implementation)
Create a single consumable product:
- **Product ID:** `com.pejul.gympaddy.gp_coin_100`
- **Type:** Consumable
- **Price:** 100 Naira (Apple's minimum price)
- **Name:** GP Coins
- **Description:** Purchase GP Coins for GymPaddy

**How it works:**
1. User enters any amount >= 100 Naira in the app (e.g., 500 Naira)
2. App purchases the `com.pejul.gympaddy.gp_coin_100` product **once** (Apple charges 100 Naira - the product price)
3. After successful purchase, app calls `/api/user/top-up` with the **user-entered amount** (500)
4. Backend credits the user with 500 GP Coins (the amount they entered, not the product price)

**Why this approach?**
- Apple IAP **does NOT support quantity parameter** - you can't specify "buy 5x of this product"
- You CAN purchase the same product multiple times, but that's bad UX (user confirms 100+ purchases for 100 Naira)
- **Best solution:** Single purchase + backend handles the amount difference
- Apple charges: 100 Naira (fixed product price)
- Backend credits: User-entered amount (500 Naira in example above)

**Important Notes:**
- Apple will always charge 100 Naira (the product price) regardless of the amount entered
- The backend API receives the user-entered amount and credits that amount to the wallet
- This allows users to enter any amount >= 100 Naira without creating multiple products
- The backend should handle crediting the correct amount based on the API call
- **This is the standard approach** for variable-amount purchases in Apple IAP

## Setup Steps

1. **Create Products in App Store Connect:**
   - Go to App Store Connect → Your App → Features → In-App Purchases
   - Click "+" to create a new consumable product
   - Enter Product ID: `gp_coins_100` (or other amounts)
   - Set the price to match the amount (e.g., 100 Naira for `gp_coins_100`)
   - Add product name and description
   - Save and submit for review

2. **Test the Implementation:**
   - Use a sandbox tester account
   - Test purchases in development/staging builds
   - Verify that the topup API is called after successful purchase

3. **Production Deployment:**
   - Ensure all products are approved by Apple
   - Test with real accounts before full release

## Code Location

- **IAP Hook:** `utils/hooks/useIAP.ts`
- **TopupPanel Component:** `components/Social/live/TopupPanel.tsx`
- **Deposit Screen:** `app/deposit.tsx`

## API Endpoint

After successful purchase, the app calls:
- **Endpoint:** `POST /api/user/top-up`
- **Body:** `{ amount: number }`
- **Headers:** `Authorization: Bearer {token}`

This is the same endpoint used by Flutterwave, so no backend changes are needed.

## Important Notes

1. **Minimum Amount:** 100 Naira (enforced in the app)
2. **Platform:** iOS only (Android continues to use Flutterwave)
3. **Product ID:** Must be exactly `com.pejul.gympaddy.gp_coin_100` in App Store Connect
4. **Product Price:** Set to 100 Naira (Apple's minimum)
5. **Amount Handling:** 
   - Apple charges: 100 Naira (fixed product price)
   - Backend credits: User-entered amount (via API call)
   - Example: User enters 500 Naira → Apple charges 100 Naira → Backend credits 500 GP Coins
6. **Testing:** Always test with sandbox accounts before production

## Troubleshooting

- **"In-App Purchases are not available"**: Ensure the app is properly configured in App Store Connect and the product is approved
- **"Purchase failed"**: Check that the product ID `com.pejul.gympaddy.gp_coin_100` exists in App Store Connect and is approved
- **"Product not found"**: Create the product in App Store Connect with the exact ID `com.pejul.gympaddy.gp_coin_100`
- **API call fails after purchase**: Verify the backend endpoint `/api/user/top-up` is working correctly
- **Amount mismatch**: Remember that Apple charges 100 Naira (product price), but the backend should credit the user-entered amount

