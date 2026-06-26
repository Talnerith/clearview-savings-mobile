# Screenshots

There's a [live web demo](https://clearview-savings-mobile.vercel.app), so
screenshots are a bonus — **even 1–2 is plenty.** A strong pair is the patient
accounts screen (`patient-accounts.png`) and the diagnostics screen
(`diagnostics.png`). Add the files here, then uncomment the image table in the
main `README.md` (there's a ready-to-use snippet in a comment in its
"Screenshots" section).

Suggested filenames so the snippet works as-is:

| File | Screen to capture (in demo mode) |
| --- | --- |
| `sign-in.png` | The sign-in screen (shows the "Explore in demo mode" button) |
| `caregiver-patients.png` | Caregiver patient list (Eleanor Whitfield, Arthur Bennett) |
| `patient-accounts.png` | Patient bank view — "Your Accounts" with Available Balance + Direct Deposit Pending |
| `account-detail.png` | An account's Recent Transactions |
| `diagnostics.png` | Backend diagnostics screen after "Run connection tests" |

## How to capture

1. From the project root run `npm run web` and open the URL it prints
   (usually http://localhost:8081).
2. Tap **"Explore in demo mode"** so no real data is shown.
3. Walk: patient list → a patient → "Switch to patient view" → an account;
   and from the patient list, open **Diagnostics**.
4. Screenshot each screen and save it here with the filename above.

Phone-shaped images look best: in the browser, open dev tools (F12) → toggle the
device toolbar and pick a phone size before capturing. A short screen-recording
GIF of the same walkthrough is also great — drop it in and reference it from the
main README.
