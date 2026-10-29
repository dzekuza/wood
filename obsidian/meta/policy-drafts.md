---
tags: [meta, policy, draft]
updated: 2026-10-26
---

# Policy drafts (paste into Shopify Admin → Settings → Policies)

Drafts for the Merchant Center "Misrepresentation" fix. They match what the site
already promises: made to order, dispatched within up to 5 days, delivered in 2 to 3 working days, free UK delivery on every
order, UK only. The connector cannot write policies (`write_legal_policies`
scope), so paste these in by hand. **Confirm the marked assumptions first** and
change the site/schema together if any differ (`structuredData.ts` still says a
30-day return window).

**Assumptions to confirm:** (1) every piece is made to the customer's chosen
size and finish; (2) orders can be cancelled free of charge until production
starts; (3) courier transit is 2 to 3 working days; (4) faulty or
damaged items are reported within 14 days of delivery; (5) the return address is
given on request, not published.

---

## Refund policy

```html
<p>Last updated: October 26, 2026</p>
<p>CRAFTWOOD FURNITURE LTD (company no. 11805480) makes solid oak furniture to order in our own workshop. This policy explains your right to cancel, return or get a refund. It does not affect your statutory rights under UK consumer law.</p>

<h2>Made to order</h2>
<p>Each piece is made to the size, finish and options you choose when you order. Because made-to-measure and personalised goods are exempt from the 14-day change-of-mind right under the Consumer Contracts Regulations 2013, we cannot accept a return only because you changed your mind once production has started.</p>

<h2>Cancelling your order</h2>
<p>You can cancel your order for a full refund at any time before we start making it. Email <a href="mailto:hello@craftwoodfurniture.co.uk">hello@craftwoodfurniture.co.uk</a> with your order number as soon as possible. If production has already started, we will tell you and the order can no longer be cancelled.</p>

<h2>Faulty, damaged or incorrect items</h2>
<p>Please check your order when it arrives. If an item is faulty, damaged in transit or not what you ordered, email <a href="mailto:hello@craftwoodfurniture.co.uk">hello@craftwoodfurniture.co.uk</a> within 14 days of delivery with your order number and photos. We will offer a repair, a replacement or a refund, and we will pay the cost of collecting the item. Your legal rights under the Consumer Rights Act 2015 are not affected.</p>

<h2>Natural timber</h2>
<p>Solid oak varies in grain, knots and colour, and oil finishes can look different on screen. These natural variations are part of the product and are not a fault.</p>

<h2>Refunds</h2>
<p>Approved refunds go back to your original payment method within 14 days of us agreeing to the refund. Your bank or card provider may take a few extra days to show it.</p>

<h2>Contact</h2>
<p>CRAFTWOOD FURNITURE LTD, Tonypandy CF40 2TB<br>Email: <a href="mailto:hello@craftwoodfurniture.co.uk">hello@craftwoodfurniture.co.uk</a></p>
```

---

## Shipping policy

```html
<p>Last updated: October 26, 2026</p>
<p>We make every piece to order in our UK workshop and deliver by courier anywhere in the United Kingdom.</p>

<h2>Delivery cost</h2>
<p>Delivery within the United Kingdom is free on every order. The price you see at checkout is the price you pay.</p>

<h2>How long it takes</h2>
<p>Your order is dispatched within up to 5 days of being placed. It is packed and sent by courier, and delivery then takes 2 to 3 working days. We will email you tracking details as soon as your order is dispatched.</p>
<p>If you need your order by a particular date, contact us before ordering and we will tell you whether it is possible.</p>

<h2>Where we deliver</h2>
<p>We currently deliver to addresses in the United Kingdom only. We do not ship outside the United Kingdom.</p>

<h2>Delays</h2>
<p>Delivery dates are estimates. If your order is delayed, we will let you know. Please check your delivery address at checkout and contact us straight away if it needs changing.</p>

<h2>Receiving your order</h2>
<p>Large items such as mantel beams and fireplace surrounds are heavy. Please inspect the packaging when it arrives and report any damage within 14 days by emailing <a href="mailto:hello@craftwoodfurniture.co.uk">hello@craftwoodfurniture.co.uk</a> with photos, as set out in our <a href="/policies/refund-policy">Refund policy</a>.</p>

<h2>Contact</h2>
<p>CRAFTWOOD FURNITURE LTD, Tonypandy CF40 2TB<br>Email: <a href="mailto:hello@craftwoodfurniture.co.uk">hello@craftwoodfurniture.co.uk</a></p>
```

---

## Privacy policy

Replaces the whole Shopify template (which is US-flavoured and still carries the
old street address). UK GDPR wording. **Confirm:** the analytics/advertising line
names Google generically; list the real tools if you use others.

```html
<p>Last updated: October 26, 2026</p>
<p>CRAFTWOOD FURNITURE LTD ("we", "us") is a company registered in England and Wales, company no. 11805480, based in Tonypandy CF40 2TB. We run the website craftwoodfurniture.co.uk and are the data controller of the personal information described in this policy. The store is powered by Shopify.</p>

<h2>What we collect</h2>
<ul>
<li><strong>Order and contact details:</strong> your name, delivery and billing address, email address and phone number.</li>
<li><strong>Payment details:</strong> payments are handled by Shopify and its payment providers. We do not see or store your full card number.</li>
<li><strong>Account details:</strong> if you create an account, your email address and order history.</li>
<li><strong>Messages:</strong> anything you send us, for example when you email about an order.</li>
<li><strong>Device and usage information:</strong> your IP address, browser, device and how you use the site, collected through cookies and similar technologies.</li>
</ul>

<h2>How we use it and why</h2>
<ul>
<li><strong>To make and deliver your order, take payment and handle returns</strong> (to perform our contract with you).</li>
<li><strong>To answer your questions and give support</strong> (our legitimate interest in running the business, or to take steps you ask for).</li>
<li><strong>To prevent fraud and keep the site secure</strong> (our legitimate interest).</li>
<li><strong>To keep accounting and tax records</strong> (our legal obligation).</li>
<li><strong>To understand how the site is used and to improve it, and to show relevant ads</strong> (your consent, where cookies require it, or our legitimate interest).</li>
<li><strong>To send marketing emails</strong> only if you have opted in. You can unsubscribe at any time using the link in any email.</li>
</ul>

<h2>Who we share it with</h2>
<p>We only share what is needed with: Shopify (our store platform and payments), couriers who deliver your order, our email and website service providers, analytics and advertising services such as Google, and professional advisers or authorities where the law requires. These providers act on our instructions or under their own privacy notices. We do not sell your personal information.</p>

<h2>Cookies</h2>
<p>We use cookies that are needed for the basket and checkout to work, and, with your consent where required, cookies for analytics and advertising. You can control cookies in your browser settings.</p>

<h2>International transfers</h2>
<p>Some of our providers, including Shopify, may process data outside the United Kingdom. Where they do, we rely on approved safeguards such as the UK International Data Transfer Agreement or addendum, or an adequacy decision.</p>

<h2>How long we keep it</h2>
<p>We keep order and accounting records for as long as the law requires, normally six years. Other information is kept only as long as we need it for the purposes above, and marketing details until you unsubscribe.</p>

<h2>Your rights</h2>
<p>Under UK data protection law you have the right to access your personal information, have it corrected or deleted, restrict or object to how we use it, receive a copy in a portable format, and withdraw consent at any time. To use any of these rights, email <a href="mailto:hello@craftwoodfurniture.co.uk">hello@craftwoodfurniture.co.uk</a>. We may need to confirm your identity first.</p>

<h2>Complaints</h2>
<p>If you are unhappy with how we use your information, please contact us first. You can also complain to the Information Commissioner's Office at <a href="https://ico.org.uk">ico.org.uk</a> or on 0303 123 1113.</p>

<h2>Children</h2>
<p>Our website is not aimed at children and we do not knowingly collect their personal information.</p>

<h2>Changes</h2>
<p>We may update this policy from time to time. The latest version is always on this page, with the date above.</p>

<h2>Contact</h2>
<p>CRAFTWOOD FURNITURE LTD, Tonypandy CF40 2TB<br>Email: <a href="mailto:hello@craftwoodfurniture.co.uk">hello@craftwoodfurniture.co.uk</a></p>
```
