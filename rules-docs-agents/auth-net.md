### Integration brief · **TradersLaunch “pay‑until‑fail” billing stack**

---

#### 0 · Ground rules we’re building to

* **Price & cadence** Trader pays a fixed fee every 30 days. Billing stops the moment your risk engine marks the account *failed* or *passed*.
* **Tender types** Cards (Visa/MC/AmEx, etc.) and ACH/eCheck only. No Apple Pay, Google Pay or PayPal.
* **Front‑end** Next.js app (React) will embed **Authorize.Net Accept Hosted** (simplest) *or* **Accept.js** (more styling control, still SAQ‑A).
* **Receipts** Either gateway emails or your own—both paths described below.
* **Environments** Sandbox first, then production; each with its own credential set.
* **Cancellation trigger** Your risk‑engine micro‑service calls our backend, which fires the cancel request (ARB) or simply stops scheduling (DIY).
* **Reporting** Merchant‑interface export is *sufficient*, but API hooks are listed so you can automate later.

---

#### 1 · Tokenising the payment instrument

**Accept Hosted** (recommended for speed)

1. Call `getHostedPaymentPageRequest` to receive a short‑lived **form token**.
2. Drop `<iframe>` into the Next.js page; Authorize.Net hosts the PCI form.
3. When the trader clicks *Pay*, the gateway posts `net.authorize.payment.authcapture.created` to your webhook.

**Accept.js** (if you need seamless styling)

1. Load `https://js.authorize.net/v1/Accept.js`.
2. `Accept.dispatchData()` returns an `opaqueData` token.
3. Send that token to your backend; include it in the `payment → opaqueData` field of the API requests that follow.

Both flows keep you in **SAQ‑A** scope.

---

#### 2 · First‑charge endpoint

`createTransactionRequest` with `transactionType = "authCaptureTransaction"`.

Minimal JSON:

```json
{
  "createTransactionRequest": {
    "merchantAuthentication": { "name": "API_LOGIN_ID", "transactionKey": "TRANSACTION_KEY" },
    "refId": "trader_913_signup",
    "transactionRequest": {
      "transactionType": "authCaptureTransaction",
      "amount": "109.00",
      "payment": { "opaqueData": { "dataDescriptor": "...", "dataValue": "..." } },
      "customer": { "id": "trader_913", "email": "alice@sample.com" }
    }
  }
}
```

*For ACH* swap `payment.bankAccount` for the `opaqueData` block; everything else is identical. Authorize.Net supports same‑day and next‑day eCheck clearing. ([authorize.net][1])

---

#### 3 · Recurring plan mechanics

Because the fee *never changes* and always bills every 30 days, the cleanest path is Authorize.Net’s **Automated Recurring Billing (ARB)**.

**Create** — `ARBCreateSubscriptionRequest`

* `startDate`: first‑charge date + 30 days
* `interval → { length: "30", unit: "days" }`
* `amount`: same as signup
* `payment`: token (card) or bankAccount (ACH)

**Cancel** — `ARBCancelSubscriptionRequest`
Triggered by your risk engine; only needs the `subscriptionId`.

If you later decide you need prorates, one‑off fees, or dynamic cycles, swap to your own scheduler:

* Store the card via `createCustomerProfileRequest` / `createCustomerPaymentProfileRequest`
* Fire `createCustomerProfileTransactionRequest` each month
* On fail/pass, **stop scheduling**—no cancel call required.

---

#### 4 · Webhooks for real‑time sync

*Admin endpoints* (REST)
`POST https://api.authorize.net/rest/v1/webhooks` (create)
`PUT /webhooks/{id}` (update)
`DELETE /webhooks/{id}` (delete)

*Events to subscribe to*

* `net.authorize.payment.authcapture.created` (initial fee & each rebill)
* `net.authorize.customer.subscription.cancelled` confirms our cancel call
* `net.authorize.customer.subscription.failed` gateway decline on rebill (rare with a fixed fee)

**Security** Validate `X‑ANET‑SIGNATURE` by hashing the raw body with HMAC‑SHA512 and your **Signature Key** (obtain it in Merchant Interface → API Credentials & Keys). ([Authorize.net][2])

---

#### 5 · Optional service calls you’ll probably want later

* `refundTransaction` (full or partial refunds)
* `voidTransaction` if you need to cancel *same‑day* signup charges before settlement
* `ARBGetSubscriptionStatusRequest` manual audits
* `getSettledBatchListRequest` / `getTransactionDetailsRequest` automated reconciliation

---

#### 6 · Email receipts options

*Turn on gateway emails* — add

```json
"transactionSettings": {
  "setting": { "settingName": "emailCustomer", "settingValue": "true" }
}
```

*Send your own* — leave it off; use webhook success events to trigger an internal SendGrid/Litmus template.

---

#### 7 · Environment variables to provision

```
# common
API_LOGIN_ID                 # from Merchant Interface
TRANSACTION_KEY              # from Merchant Interface
SIGNATURE_KEY                # for webhook HMAC verify
PUBLIC_CLIENT_KEY            # only if using Accept.js
ENV                          # "sandbox" | "production"
AUTHNET_ENDPOINT             # apitest.authorize.net or api.authorize.net
# front‑end
ACCEPT_HOSTED_IFRAME_ORIGIN  # your Next.js domain for postMessage
```

Rotate `TRANSACTION_KEY` and `SIGNATURE_KEY` when staff changes or at least annually.

---

#### 8 · Sandbox workflow

1. Use **apitest.authorize.net/xml/v1/request.api**.
2. Sample card `4111 1111 1111 1111`, any future expiry, any CSC.
3. Force declines with amounts: `$0.99` (error 54), `$2.71` (error 63).
4. Verify webhooks fire; Authorize.Net posts within \~10 seconds.
5. Promote by swapping credentials and endpoint host.

---

#### 9 · Next.js wiring sketch

* Server‑side route `/api/authnet/charge` holds the merchant keys.
* React component loads Accept Hosted iframe or Accept.js, captures the token, `fetch()`es the charge route.
* After success, router pushes the trader to `/dashboard/payments?status=paid`.
* Webhook handler under `/api/authnet/webhook` verifies HMAC, then updates DB → triggers SSE or WebSocket to the UI.

---

### 10 · Crypto payments – optional track

Authorize.Net does **not** natively support cryptocurrency. To offer crypto subscriptions you’ll pair a specialist processor with your existing flow:

1. **Gateway choices that already handle recurring**

   * **NOWPayments “Crypto Subscriptions”** (custody optional, REST JSON). ([NOWPayments][3])
   * **BoomFi** (on‑chain smart‑contract pulls). ([boomfi.xyz][4])
   * **Loop Crypto** (Stripe‑style APIs; supports per‑second metering). ([loopcrypto.xyz][5])

2. **How it fits**

   * Front‑end offers “Pay with Crypto” → redirect or QR code checkout.
   * The crypto gateway emits webhooks (paid / subscription\_cancelled).
   * Map those events to the same **risk‑engine cancel** and **dashboard status** logic you use for Authorize.Net.

3. **Gotchas**

   * Volatility — price your plans in stable‑coins (USDC/USDT) to avoid FX drift.
   * KYC/AML — ensure your processor covers compliance if you service U.S. traders.
   * Accounting — treat crypto receipts as non‑cash assets; your bookkeeper will need cost‑basis tracking.

4. **Alternate hybrid**

   * Keep Authorize.Net as the primary gateway; show a separate “Pay in Crypto” button that calls NOWPayments (or similar). Store the tx‑hash and treat the plan as *paid in full* for the 30‑day cycle. No ARB on the crypto side—your app just reminds the trader with a new invoice each month.

---

### 11 · Next steps for the dev team

* Spin up sandbox keys; wire Accept Hosted iframe into the Next.js signup flow.
* Implement `POST /api/authnet/cancel` that receives *risk‑engine* events and calls `ARBCancelSubscriptionRequest`.
* Stand up `/api/authnet/webhook` and verify HMAC – use the Signature Key.
* Decide whether to let Authorize.Net send customer emails; if not, add email send in webhook handler.
* Evaluate NOWPayments vs BoomFi if crypto becomes a requirement; both offer test‑nets for sandboxing.

That’s everything your engineers need—endpoint names, payload skeletons, keys, webhook security and optional crypto path. If anything still feels unclear, shoot over the gap and I’ll fill it in.

[1]: https://www.authorize.net/?utm_source=chatgpt.com "Payment processing: Accept payments anywhere | Authorize.net"
[2]: https://developer.authorize.net/api/reference/features/webhooks.html?utm_source=chatgpt.com "Authorize.net API Documentation - Webhooks"
[3]: https://nowpayments.io/crypto-subscriptions?utm_source=chatgpt.com "Crypto Subscriptions - NOWPayments"
[4]: https://www.boomfi.xyz/subscriptions?utm_source=chatgpt.com "Crypto Subscription Payments - BoomFi"
[5]: https://www.loopcrypto.xyz/payments?utm_source=chatgpt.com "Crypto Subscription Payments - Simple Recurring Billing"
