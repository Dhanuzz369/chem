# Setting up the leads Sheet (Google Apps Script)

The website's quote form sends every buyer to a Google Sheet in your goodbizglobal.com Workspace.

- There is one row per buyer.
- The row is created as soon as they enter their contact details.
- The row is updated as they fill in each step.
- An email alert goes to **chemicals@goodbizglobal.com** when a new lead arrives and again when they finish the request.

The script is in [`apps-script/leads/Code.gs`](../apps-script/leads/Code.gs).

## 1. Create the Sheet

1. Sign in to Google with your **goodbizglobal.com** account.
2. Open Google Sheets and create a blank spreadsheet. Name it, for example, `Goodbiz Chem – Website leads`.

## 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Delete everything in `Code.gs` and paste in the whole of [`apps-script/leads/Code.gs`](../apps-script/leads/Code.gs).
3. Click **Save** (the disk icon).
4. Choose `setup` in the function menu at the top and click **Run**.
5. Google asks for permission. Click **Review permissions**, choose your account, then **Allow**. If you see "Google hasn't verified this app", click **Advanced → Go to (project name)**. This is your own script.
6. Go back to the Sheet. You now have two tabs:
   - **Leads**, with the column headers.
   - **Summary**, which counts how far each buyer got.

## 3. Deploy it as a web app

1. In the Apps Script editor click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set these options:
   - **Description:** `Website leads`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
5. Open that URL in a browser. You should see "Goodbiz Chem leads endpoint is running."

**If "Anyone" isn't offered** (only "Anyone within goodbizglobal.com"), your Workspace blocks public web apps. To allow them:

1. In the **Google Admin console**, go to **Apps → Google Workspace → Drive and Docs → Sharing settings**.
2. Allow sharing outside goodbizglobal.com.
3. Deploy again.

## 4. Connect it to the website

The website reads the `/exec` URL from `NEXT_PUBLIC_LEADS_ENDPOINT` in the project file `.env.production`. The current URL is already there. Only a **new deployment** (a new URL) needs that line changed; re-deploying a new **version** of the same deployment keeps the URL.

To change it without editing the file, add `NEXT_PUBLIC_LEADS_ENDPOINT` in **Vercel → your project → Settings → Environment Variables**; it overrides `.env.production`. Redeploy after either change.

## 5. Check that alerts arrive

1. Fill in step 1 of the quote form on the website.
2. Within a minute you should see:
   - a new row in **Leads**;
   - an email **"New lead: …"** at chemicals@goodbizglobal.com.
3. Reply to that email to answer the buyer directly. Reply-To is set to their email address.

If the alert lands only in **Sent** and not in your inbox, add a Gmail filter. This can happen because the alias belongs to the same account that runs the script.

1. Search for `from:me subject:("New lead" OR "Quote request completed")`.
2. Choose **Create filter → Never send it to Spam**, and apply the label `Leads`.

## Changing things later

**The script's settings** are at the top of the script:

| Setting | What it controls |
|---|---|
| `ALERT_TO` | The address that receives the alerts |
| `SITE_URL` | The "Back to Goodbiz Chem" link shown to buyers |
| `MAX_NEW_LEADS_PER_HOUR` | Default `60`. New buyers accepted per hour. Over it, no row is added, and the website shows the WhatsApp/email buttons when the buyer presses Send, so a real buyer still reaches you. |
| `MAX_UPDATES_PER_LEAD_PER_HOUR` | Default `40`. Later-step updates accepted for one buyer per hour. A real buyer sends about seven. |
| `MAX_ALERT_EMAILS_PER_HOUR` | Default `30`. "New lead" emails per hour. Over it, rows are still saved but no email is sent. |
| `MAX_COMPLETED_ALERTS_PER_HOUR` | Default `60`. "Quote request completed" emails per hour, counted separately, so a flood of new leads never holds back the email for a buyer who finished. Over it, rows are still saved but no email is sent. |
| `MIN_DAILY_MAIL_QUOTA` | Default `5`. Google limits how many emails a script may send per day. When `5` or fewer are left, alerts are skipped (rows are still saved), so the quota is never fully used up. |
| `MAX_BODY_BYTES` | Default `20 * 1024` (20 KB). Bigger posts are refused. |

**Why the limits:** the web-app address is public, so anyone could post to it. The limits stop a flood of fake posts from filling the sheet or your inbox. Counts reset at the start of every hour (UTC) and are kept in the script's cache, not in the sheet. To change a limit, edit the number, **Save**, and re-deploy as a new version (below); the change only takes effect after that.

**Checking whether a limit was hit:** in the Apps Script editor open **Executions** and look at the logs. Search for `Rate limited` (a post was refused) or `skipped` (an alert email was not sent; the row is in the sheet).

**Re-deploying after an edit** (any change to the script, including the limits, takes effect only after this)

1. Click **Deploy → Manage deployments**.
2. Click the pencil next to your deployment.
3. Set **Version** to **New version**.
4. Click **Deploy**.

The `/exec` URL stays the same.

**Columns:** don't rename or reorder the header row. The website and the script rely on it.

## What the columns mean

| Column | Meaning |
|---|---|
| leadId | Random ID for one visitor. Every step updates the same row. |
| stage | The furthest step the buyer reached: `contact` → `product` → `quantity` → `destination` → `terms` → `submitted`. |
| firstSeen / updated | When the lead first arrived, and when it was last updated (UTC). |
| name, company, email, phone | Contact details from step 1. |
| group, product, otherProduct | Product type, product, or a chemical the buyer typed in ("Something else"). |
| quantity, quantityOther, packaging | Quantity choice, a typed-in amount, and packaging. |
| country, port | Destination. |
| terms | FOB / CFR / CIF / Delivered within India / Not sure. |
| notes | The buyer's notes. |
| sourcePage, userAgent | The page the form was sent from, and the buyer's browser. |

Values starting with `=`, `+`, `-` or `@` are saved with a leading `'`, so Sheets never treats them as formulas. Sheets hides that `'` in the cell; you only see it in the formula bar when you select the cell (for example on phone numbers like `+91…`). It is harmless.
