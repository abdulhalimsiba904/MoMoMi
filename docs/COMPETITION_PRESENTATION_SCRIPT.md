# MoMoMI Competition Presentation Script

## Main presentation — about 4 minutes

**[Open on the Dashboard.]**

Good morning. I’m presenting MoMo Merchant Intelligence, or MoMoMI.

Many small merchants receive money throughout the day, but a transaction history does not always tell them what each payment was for. A personal transfer, a customer payment, and a business expense can all appear as money moving through the same account. If those movements are not recorded with their business meaning, it is harder to keep useful sales, expense, and stock records.

I built MoMoMI to explore that problem. The merchant identifies what a payment represents, confirms the record, and can then use it for business decisions. The flow is **Money Movement → Business Activity → Verification → Business Data → Intelligence**.

**[Point to the Dashboard totals and the review summary.]**

This is Ama’s Footwear in a synthetic demo environment. The Dashboard shows GH₵5,900 received and GH₵2,300 sent. It separates business, non-business, and unclassified movements. The GH₵3,600 difference is Net Money Movement; it is not profit. Money received is not automatically revenue, and money sent is not automatically an expense. Two records need attention: an unclassified GH₵400 incoming payment and an unclassified GH₵200 outgoing payment.

**[Open Money In. Select the GH₵3,400 transaction, then open its sale details.]**

Here is the GH₵3,400 customer payment, already linked to confirmed sale SALE-001 in the seeded demo. It contains 8 White Sneakers at GH₵350 each (GH₵2,800) and 2 Blue Sneakers at GH₵300 each (GH₵600): 10 units, GH₵3,400 total. I’ll use the GH₵750 payment for a new confirmation so I can keep this starting example intact.

**[Open Inventory.]**

Inventory comes from opening stock plus confirmed movements. White Sneakers are at 12 pairs and Blue Sneakers at 13; the other products are at 10 Black Loafers, 25 Brown Sandals, and 30 Classic Slippers. That is 90 recorded units, all above their review thresholds. A digital count does not replace a physical stock count.

**[Open Analytics, then show Business Pulse and its evidence.]**

Analytics uses those same records: GH₵3,400 Recorded Revenue from the confirmed sale and GH₵1,700 in Verified Business Expenses. Business Pulse observations include evidence. The White Sneakers observation links to the sale items and current stock calculation.

**[Open Alerts.]**

Alerts brings the two unclassified payments together. They remain unclassified until someone reviews them. Marking an alert as reviewed only acknowledges it; it does not change the transaction itself.

**[Open Business Copilot. Ask “How much revenue did I record?” and “What should I review?”]**

The Copilot answers from the current demo records, including the same alert state. Today these are predefined, rule-based responses, not a live language model. It can also say when there is not enough historical information to explain a change or make a forecast.

The prototype uses React, TypeScript, Vite, synthetic data, and local React state. A future version could add a FastAPI/Python service, PostgreSQL or Supabase, business and verification engines, an intelligence layer, and eventually an AI Copilot. That is a possible architecture, not what runs today. Any MTN connection would depend on an approved, consent-based integration path; this prototype has no live MTN data or API connection.

The business model is a hypothesis. I would test whether merchants would pay for clearer records and stock visibility; partner distribution is another idea to explore. The intended impact is practical: make it easier to keep useful records and understand business activity. It does not promise credit, savings, or growth.

MoMoMI is not a replacement for transaction history, accounting, or a general chatbot. It focuses on linking a payment to a merchant-confirmed activity, then showing how that record affects sales, stock, and insights. My next step is to test the workflow with merchants and learn what needs to change.

Thank you. I’m happy to take your questions.

## Live demo checklist

1. **Dashboard:** Point out Money In **GH₵5,900**, Money Out **GH₵2,300**, the business/non-business/unclassified breakdowns, Net Money Movement **GH₵3,600 (not profit)**, and two review items.
2. **Money In:** Open the **GH₵3,400** Customer payment. Show that it is a Product Sale and open the linked SALE-001 details.
3. **Sale details:** Show 8 × GH₵350 = GH₵2,800 and 2 × GH₵300 = GH₵600; total **GH₵3,400**, **10 units**. Explain that this seeded record is already confirmed.
4. **Inventory:** Show White Sneakers **12**, Blue Sneakers **13**, Black Loafers **10**, Brown Sandals **25**, Classic Slippers **30**; total **90 units**, no stock alerts.
5. **Analytics:** Show Recorded Revenue **GH₵3,400**, Verified Business Expenses **GH₵1,700**, and the distinction between those figures and total money movement.
6. **Business Pulse:** Open evidence for the White Sneakers observation and point to its sale items, linked payment, stock, and threshold.
7. **Alerts:** Show the GH₵400 incoming and GH₵200 outgoing unclassified records. Explain that review acknowledgement does not reclassify either one.
8. **Business Copilot:** Ask “How much revenue did I record?” and “What should I review?” Explain that the responses are deterministic and use current demo records.
9. **Optional interactive sale:** To show confirmation without disturbing SALE-001, use the GH₵750 payment, add 1 White Sneakers (GH₵350) and 4 Classic Slippers (GH₵400), then confirm the matched GH₵750 sale. Point out that inventory and analytics update in local session state.

## 30-second version

Small merchants can receive money all day without a clear record of what each payment means for the business. I built MoMoMI to help connect money movement to merchant-identified business activity, confirmed sales, inventory, and useful business insights. In the demo, a GH₵3,400 payment is linked to 10 confirmed footwear units, and the recorded stock and analytics reflect that sale. The prototype uses synthetic data and local state; it is not connected to MTN and does not use a live AI model. The next step is to test the workflow with merchants.

## 60-second version

MoMoMI is a prototype for small merchants who need more context than a list of payments. A transaction by itself does not tell us whether it was a sale, a personal transfer, or a business expense, so MoMoMI keeps those categories separate and asks the merchant to identify the activity.

In the demo, the GH₵3,400 payment is linked to SALE-001: 8 White Sneakers and 2 Blue Sneakers. Once confirmed, that record supports GH₵3,400 in Recorded Revenue and stock of 12 White Sneakers and 13 Blue Sneakers. The Dashboard and Analytics also show total Money In and Money Out, but Net Money Movement is not profit, and total money received is not revenue.

This version uses synthetic records, deterministic calculations, predefined Copilot responses, and local session state. It has no live MTN connection, production database, or LLM. I’m presenting it as a working prototype and a hypothesis to validate with merchants, not as a finished service.

## Likely judge questions & answers

**Why this problem?**  
Many small merchants see payments arrive but still have to work out what they mean for sales, expenses, and stock. I wanted to explore how those records could be connected.

**Why would merchants use it?**  
The hypothesis is that clearer daily records and stock visibility save effort and help merchants understand their business. That needs to be tested with real users.

**How does it make money?**  
A small merchant subscription is one possibility. Partner distribution is another. Both are business hypotheses; I have not validated willingness to pay.

**How does it avoid incorrect AI conclusions?**  
There is no live AI model in this prototype. The calculations are deterministic, and Copilot answers are predefined. A future model should explain verified records, show evidence, and say when the data is insufficient.

**How does it handle personal transactions?**  
They stay classified as non-business. They count in Money In or Money Out, but they are not treated as business revenue or verified expenses.

**How does it verify a sale?**  
The merchant selects products and quantities. The total must match an incoming payment, and the merchant confirms the sale before it becomes a recorded sale.

**How does inventory work?**  
It starts from catalogue opening stock and applies recorded movements. In the current sale workflow, only a valid confirmed sale creates a stock deduction. A digital count can still differ from physical stock.

**What happens with incomplete or unclassified data?**  
It remains unclassified and appears as needing review. MoMoMI does not guess its meaning from the amount alone.

**Why does MTN benefit?**  
Potentially, better merchant tools could make digital payments more useful to merchants. That is an opportunity to explore, not a proven result or an existing MTN partnership.

**How could this scale?**  
The product could be tested with more merchants and transaction types, then built on a secure backend and an approved integration path. That work has not been done yet.

**What is actually built today?**  
Seven frontend pages, synthetic transactions, local classification and confirmation flows, inventory and analytics calculations, evidence-backed Business Pulse, Alerts, and deterministic Copilot responses.

**What would you build next?**  
I would test the classification and sale-confirmation flow with merchants, learn where it is confusing, and validate the value before committing to an integration or business model.

## Claims to avoid

- “MoMoMI is connected to MTN MoMo” or “we receive live MTN transactions.”
- “This is a real AI Copilot” or “the AI predicts sales.”
- “GH₵3,600 is profit.” It is Net Money Movement, not profit.
- “GH₵5,900 is revenue” or “GH₵2,300 is business expenses.”
- “The sale or expense was independently verified.” The demo shows synthetic records and merchant-confirmation steps, not external verification.
- “Merchants are already using it,” “we have proven adoption,” or claims of proven savings, revenue growth, or credit access.
- “We have an MTN partnership,” “production deployment,” or a production database.
- Any forecast, trend, probability, or stock depletion date that is not supported by the available records.

## Architecture: current and possible future

**Built today:** React + TypeScript + Vite → shared local React state → deterministic transaction, sale, expense, inventory, analytics, alert, and intelligence calculations → predefined Copilot responses.

**Possible future architecture:** React frontend → FastAPI/Python service → PostgreSQL or Supabase (to be selected) → business engines and verification rules → intelligence layer → AI Copilot that explains supported results. Any external integration would require an approved access method, merchant consent, security review, and data-protection work. None of those backend or integration components are present in this prototype.
