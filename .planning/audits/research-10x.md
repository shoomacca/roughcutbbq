# RoughCut BBQ: "10x quality" research (2026-09-30)

Method note. Every factual line carries a URL. Tags: MEASURED = the page was fetched or the search result text was read this session. GUESSED = my inference. UNVERIFIED = no primary source reached.

Gaps you need to know up front:
- Reddit (r/smoking, r/BBQ) was NOT reachable. Complaint evidence comes from Trustpilot, forum threads (smokingmeatforums, AmazingRibs forum) and app-store aggregators. No Reddit claim is made.
- amazingribs.com, masterclass.com and meater.com returned 403/404 to fetch. AmazingRibs claims come from search-result excerpts only.
- Amazon AU operating-agreement page returned 503. The AU help topic page did load (cited below).
- accc.gov.au influencer guidance page 404'd on fetch. ACCC claims come from search excerpts and law-firm summaries. Re-check the ACCC page directly before publishing your disclosure copy.
- FSANZ: the 75C figures below are from the Food Safety Information Council (FSIC), not FSANZ itself. Not verified against the FSANZ Food Standards Code or a state health site.
- USDA figures came from search excerpts of FSIS/foodsafety.gov pages, not a full page fetch.
- "Effort" scores in the feature ranking are GUESSED (I did not read your codebase).

---

## 1. Competitor matrix

| Product | Core | Cook-planning UX | Notifications / graphs / prediction | Content / monetisation | Complaints |
|---|---|---|---|---|---|
| AmazingRibs | 2,000+ pages of reviews, recipes, science ([about](https://amazingribs.com/about-us-how-amazingribscom-works/)) | Time-per-pound and stall articles, not an interactive planner (GUESSED, not seen) | none | Revenue order per Meathead: memberships, then ads, then affiliates; Pitmaster Club 17,000+ members; affiliate income "declined" ([source](https://bbqnewsletter.substack.com/p/meathead-amazing-ribs-profile)); says it takes no paid articles ([about](https://amazingribs.com/about-us-how-amazingribscom-works/)) | not researched |
| MEATER (app + wireless probe) | Probe internal + ambient sensors; Guided Cook | Estimator uses internal, ambient and chosen protein, and accounts for carryover during rest ([support](https://support.meater.com/hc/en-us/articles/36914985836315)); estimate appears once internal temp has risen about 8C/16F ([search excerpt of MEATER support](https://support.meater.com/hc/en-us/articles/36914985836315)) | Custom alerts, connectivity monitoring | Hardware sales | Trustpilot (6,169 reviews): connection failures, inaccurate cook times ([Trustpilot](https://ie.trustpilot.com/review/meater.com)). Forum: not designed for long smokes; low-and-slow with pit near target gives no estimate ([smokingmeatforums](https://www.smokingmeatforums.com/threads/meater.269679/)) |
| ThermoWorks app / Signals / Smoke | 4-channel BBQ alarm, Bluetooth + Wi-Fi, works with Billows fan | Alarms per probe | Push alarms, graphs, unlimited saved graphs and notes in ThermoWorks Cloud ([thermoworks.com/thermoworks-app](https://www.thermoworks.com/thermoworks-app)) | Hardware sales | Not researched (no source found) |
| FireBoard | Cloud thermometer, logs every cook | Drive Programs: stepwise temp/time profile for a pit controller ([docs](https://docs.fireboard.io/app/analyze.html)) | Chart/detail toggle, alerts with min/max and minute buffer, email/SMS/in-app, quiet hours, "Analyze" to predict progress ([docs](https://docs.fireboard.io/app/app-analyze/)) | Hardware sales | Not researched |
| Traeger app (WiFIRE) | Pellet grill remote control, recipes | Recipe-led | 4.8 stars, 290,768 reviews per an aggregator ([appfollow](https://apps.appfollow.io/ios/traeger/1094569463?country=us)) | Hardware + pellets | Wi-Fi drops, displayed vs actual temp gaps, support ([AmazingRibs review excerpt](https://amazingribs.com/smoker/traeger-pro-575-pellet-grill-review) plus [BBQGuys reviews](https://www.bbqguys.com/i/3054387/traeger/timberline-850-wi-fi-controlled-wood-pellet-grill-2019-tfb85wle?page=3)) |
| Weber Connect | Wi-Fi/Bluetooth hub with probes | Guided cooks | Alerts | Hardware | App crashes on pairing, confusing UI, recipes shown when user wants basic timing, battery/connectivity ([BBQGuys reviews](https://www.bbqguys.com/i/3065639/weber-grills/connect-wifi-enabled-smart-grilling-hub-3201?page=16)) |
| Kamado Joe / Big Green Egg (EGG Genius) | Remote monitor, graphs, alerts when cook finished or pit out of range ([Egghead forum](https://eggheadforum.com/discussion/comment/2445469)) | n/a | Kamado Joe app 4.34 rating; top complaint is connectivity ([marlvel](https://marlvel.ai/api/llm/apps/food-drink/kamado-joe)) | Hardware | See left |
| BBQ Buddy | Smart thermometer; pick meat and doneness, app estimates | Estimate-based | Not researched | Hardware (Aldi-style retail, GUESSED) | No reviews found ([GadgetGuy](https://gadgetguy.com.au/iphone-android-get-bbq-alerts-with-smart-thermometer/)) |
| Web "brisket/smoking time calculators" | Weight + pit temp to a timeline | Some plan by serve-time or start-time and show start time, cook range, rest window, stall/wrap timing (search excerpt; pages are scraped-looking mirrors, e.g. [example](https://sa.reviveourhearts.com/?p=4781)) | none | Ads/affiliate (GUESSED) | Not researched |

Takeaway (MEASURED gaps, GUESSED conclusion). Hardware apps own live cook mode and prediction but are gated behind a probe and complain about connectivity. Free web calculators own planning but are thin, and I found no evidence that any of them is offline-capable or does multi-item serve-by scheduling. That is your opening: a probe-free planner that does what MEATER does not (long low-and-slow, multi-cut, serve-by) plus optional manual "log a probe reading and re-estimate".

---

## 2. "10x feature" shortlist, ranked by value / effort (effort GUESSED)

| # | Feature | Evidence it matters | Effort | Notes |
|---|---|---|---|---|
| 1 | Serve-by reverse timeline (enter dinner time, get start, wrap, pull, rest, serve; multi-cut on one timeline) | Calculators that do this exist and are how people plan ([excerpt](https://sa.reviveourhearts.com/?p=4781)); MEATER's estimator fails on long smokes ([forum](https://www.smokingmeatforums.com/threads/meater.269679/)) | Low | You already have times and milestones; this is scheduling on top |
| 2 | Show ranges, not a single number, with a stated confidence and "cook to temp not time" | Sources give 1 to 1.5 h/lb and 1.5 to 2 h/lb for the same cut (table below); "smoke them to temp, not just by time" ([grillingdad](https://thegrillingdad.com/how-to-grill/pork/how-long-to-smoke-pork-shoulder-butt/)) | Low | Builds trust; guards against being wrong |
| 3 | Hold/rest planner (faux cambro): buffer so meat finishes early and holds above 60C | Faux cambro holds above 140F/60C for 6+ h in typical coolers, 10+ h in premium ([barbecuefaq](https://barbecuefaq.com/faux-cambro-how-to-hot-hold-bbq/)) | Low | Turns stall uncertainty into a safe cushion |
| 4 | Cook mode: big-type screen, wake lock, step-by-step pages, timers | NYT Cooking keeps the screen awake while recipes show ([Pratt IxD critique](https://ixd.prattsi.org/2025/02/design-critique-nyt-cooking-mobile-app/), search excerpt); Crouton's play button pages through steps and won Apple's 2024 Interaction award ([interest.co.nz](https://www.interest.co.nz/technology/128138/new-zealander-devin-daviess-crouton-named-top-app-interaction-category-apples)); Wake Lock lists "following a recipe" as a use case ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock)) | Low-Med | Also gives the Android wrapper real "app" value (see Play policy) |
| 5 | Notifications: local reminders for wrap, spritz, check, pull, rest-end | FireBoard/ThermoWorks lead here ([docs](https://docs.fireboard.io/app/app-analyze/)); web push/timers are weaker on iOS (GUESSED) | Med | Do local notifications in the Android wrapper |
| 6 | Manual probe log to re-estimate ("I am at 71C at 5h") with a simple fit; show the stall as a plateau band | Stall is 150 to 170F and can last "a few hours to over 7" ([smokedbbqsource](https://www.smokedbbqsource.com/the-bbq-stall-explained-how-to-beat-it/)); MEATER only estimates after ~8C rise ([support](https://support.meater.com/hc/en-us/articles/36914985836315)) | Med | The feature nobody free offers (GUESSED) |
| 7 | Environment modifiers: cold, wind, cooker type | Cold/wind: 12 to 14 h brisket can become 16 to 20 h; steady breeze can add 20%+ ([blog aggregation](https://www.blacksbbq.com/resources/blog/how-weather-impacts-bbq-smokers), quality low) | Med | Label as estimate, not measured law |
| 8 | Save/share a plan (link or PDF), offline PWA | Cooks are outdoors with bad signal (GUESSED) | Low-Med | |
| 9 | Live probe integration (Bluetooth) | Whole competitor field is here and users still complain of connectivity | High | Do NOT lead with this |

---

## 3. Reference cook-time table (test fixtures)

Warning. Quality of these sources is mostly blog/forum. Nothing here is a lab measurement. Use them as tolerance bands, and assert on monotonicity (more weight, longer time; higher pit temp, shorter time) rather than exact values. Fixtures marked NO SOURCE are still needed: source them from AmazingRibs/Franklin/ChefSteps or run your own test cooks before treating them as truth.

| # | Cut | Pit temp | Weight | Reference range | Target internal | Source |
|---|---|---|---|---|---|---|
| 1 | Brisket (whole packer) | 225F / 107C | per lb | 1 to 1.5 h/lb typical; 1.5 to 2 h/lb in one chart; plan ~1.5 h/lb plus 1 to 3+ h stall buffer | ~200 to 205F (GUESSED; not in fetched excerpts) | [smokedbbqsource](https://www.smokedbbqsource.com/the-bbq-stall-explained-how-to-beat-it/); [chart PDF, low quality](https://mcsprogram.org/HomePages/u2D955/243655/Smoking%20Time%20And%20Temperature%20Chart.pdf) |
| 1b | Brisket 10-12 lb | 275F / 135C | 10-12 lb | Franklin: about 12 h for 12 lb, "at least 14 h" quoted for 10-12 lb; 58 to 70 min/lb at 275F (forum) | | [Edible Jersey excerpt](https://ediblejersey.ediblecommunities.com/eat/visit-franklin-barbecue-austin); [tvwbb](https://tvwbb.com/threads/brisket-cooking-time-225-vs-275.98099/post-1146151) |
| 2 | Pork butt / shoulder | 225 to 250F | per lb | 1 to 1.5 h/lb (or 90 min/lb at 225F) | 195 to 205F (90 to 96C) | [grillingdad](https://thegrillingdad.com/how-to-grill/pork/how-long-to-smoke-pork-shoulder-butt/) |
| 3 | Pork spare ribs | 225 to 240F | rack | ~6 h (5 to 7 h at 250F, no wrap) | tender (probe) | [bigpoppasmokers](https://www.bigpoppasmokers.com/blogs/poppas-corner/how-long-to-smoke-baby-back-ribs-a-simple-guide) and [thegrillingdad](https://thegrillingdad.com/uncategorized/how-long-to-smoke-ribs/) (search excerpts; chart pages) |
| 4 | Pork baby back ribs | 225 to 240F | rack | ~5 h (4 to 5 h at 250F) | tender | same as row 3 |
| 5 | Beef back ribs | 225 to 240F | rack | ~5 h | tender | same as row 3 |
| 6 | Whole chicken | 225 to 250F | ~1.5-2 kg | 3 to 5 h | 165F breast (USDA) / 75C (AU) | [chart PDF, low quality](https://mcsprogram.org/HomePages/u2D955/243655/Smoking%20Time%20And%20Temperature%20Chart.pdf) |
| 7 | Chicken breasts | 225F | per breast | 1.5 to 2 h | 165F / 75C | same PDF |
| 8 | Turkey, whole 12 lb | 225 to 240F | 12 lb | ~6.5 h | 165F / 75C | [bigpoppasmokers excerpt](https://www.bigpoppasmokers.com/blogs/poppas-corner/how-long-to-smoke-baby-back-ribs-a-simple-guide) |
| 9 | Turkey legs | 225 to 240F | each | ~4 h | 75C | same |
| 10 | Beef short ribs (plate) | | | NO SOURCE | | source needed |
| 11 | Lamb shoulder | | | NO SOURCE | | source needed |
| 12 | Leg of lamb (roast) | | | NO SOURCE | | source needed |
| 13 | Pork belly | | | NO SOURCE | | source needed |
| 14 | Tri-tip / rump | | | NO SOURCE | | source needed |
| 15 | Chicken thighs | | | NO SOURCE | | source needed |

Physics and error-bar facts (MEASURED from excerpts):
- Stall is evaporative cooling, per Greg Blonder (Boston University physicist, AmazingRibs science adviser) and Meathead. He ran fat vs a wet sponge in a 225F smoker; the fat did not stall, the sponge stalled at about 140F ([AmazingRibs](https://amazingribs.com/more-technique-and-science/more-cooking-science/understanding-and-beating-barbecue-stall/)).
- Stall starts around 150 to 170F depending on size, shape, surface, moisture, cooker ([smokedbbqsource](https://www.smokedbbqsource.com/the-bbq-stall-explained-how-to-beat-it/)). Brisket stall begins after 2 to 3 h and can last up to 6 to 7 h ([AmazingRibs excerpt](https://amazingribs.com/?p=22469)).
- Foil (Texas Crutch) stops evaporative cooling; butcher paper is a middle ground ([smokedbbqsource](https://www.smokedbbqsource.com/the-bbq-stall-explained-how-to-beat-it/)).
- Weight scaling is non-linear (a 15 lb cut does not take 3x a 5 lb one) per a calculator write-up ([excerpt](https://sa.reviveourhearts.com/?p=4781); low quality, GUESSED-adjacent).
- Thickness matters more than weight for heat penetration: this is standard heat-transfer reasoning and I did NOT find a source; treat as GUESSED and validate in tests.
- Hold: faux cambro keeps meat above 60C for 6+ h (Coleman ~6 h, Yeti 10+ h) ([barbecuefaq](https://barbecuefaq.com/faux-cambro-how-to-hot-hold-bbq/)); pre-heat the cooler with near-boiling water ([smokedbbqsource](https://www.smokedbbqsource.com/faux-cambro-keep-bbq-warm/)).
- Wind and cold: see feature row 7 (low-quality source).

---

## 4. Safety temperatures

| Food | Australia (FSIC, quoting FSANZ-aligned advice; verify vs FSANZ/state) | USDA (FSIS) |
|---|---|---|
| Poultry (whole, pieces, minced) | 75C in the centre ([FSIC](https://www.foodsafety.asn.au/safe-cooking-temperatures/)) | 165F (73.9C), all poultry incl. ground ([foodsafety.gov](https://www.foodsafety.gov/print/pdf/node/10)) |
| Minced meat, burgers, sausages (incl. minced pork) | 75C | Ground meats 160F (71.1C) ([foodsafety.gov](https://www.foodsafety.gov/print/pdf/node/10)) |
| Stuffed/rolled/boned roasts, needle-tenderised or brine-pumped beef | 75C ([FSIC](https://www.foodsafety.asn.au/safe-cooking-temperatures/)) | not researched |
| Pork steaks/pieces | 70C; roasts 70 to 75C ([FSIC](https://www.foodsafety.asn.au/safe-cooking-temperatures/)) | 145F (62.8C) + 3 min rest ([FSIS](https://www.fsis.usda.gov/es/node/3293)) |
| Beef/lamb whole cuts | not verified for AU | 145F + 3 min rest |
| Reheated leftovers | 75C ([FSIC](https://www.foodsafety.asn.au/safe-cooking-temperatures/)) | not researched (USDA says 165F, GUESSED from memory, unverified) |
| Egg dishes | 72C ([FSIC](https://www.foodsafety.asn.au/safe-cooking-temperatures/)) | not researched |
| Hot holding | 60C or above ([barbecuefaq](https://barbecuefaq.com/faux-cambro-how-to-hot-hold-bbq/), 140F) | 140F (same source; USDA page not fetched) |

Product implications (GUESSED): low-and-slow targets like brisket 95C+ and pork butt 90 to 96C exceed safety minimums, so the safety check is the poultry, mince and pork rows. Show a safety floor per cut and never allow a recommended "pull" temp below it.

---

## 5. UI / motion patterns

Evidence is thin on the exact patterns; sources confirm the apps and some features only.

| App | What is praised / documented | Source |
|---|---|---|
| Crouton | 2024 Apple Design Award, Interaction category; tap play to page through steps as individual pages; timers; recipe import | [interest.co.nz](https://www.interest.co.nz/technology/128138/new-zealander-devin-daviess-crouton-named-top-app-interaction-category-apples); [MacStories](https://www.macstories.net/?p=64007) |
| Kitchen Stories | Apple Design Award winner; step-by-step guides | [App Store](https://apple.co/2IGh7Er) |
| NYT Cooking | Screen stays awake during recipes; steps highlight as completed; auto-scaled servings; grocery list grouped by aisle; users upset at removal of Print / Watch | [Pratt IxD](https://ixd.prattsi.org/2025/02/design-critique-nyt-cooking-mobile-app/) |
| Mob, Paprika | Not researched successfully (no usable source) | UNVERIFIED |

Patterns to copy (GUESSED synthesis of the above): a full-screen step-per-page cook mode; screen wake lock while in cook mode ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock): secure context only, request can be refused in power-saver, must re-acquire on visibility change); progressive highlighting of completed steps; timers attached to steps; serving-scaling that rewrites quantities. Respect `prefers-reduced-motion` (GUESSED best practice; not sourced here).

---

## 6. Disclosure rules (Australia)

- Amazon Associates AU: must show exactly "As an Amazon Associate I earn from qualifying purchases." clearly and conspicuously on your site (or tied to your social account) ([Amazon AU help](https://affiliate-program.amazon.com.au/help/node/topic/GPXFHVYZMTGPUMPE), fetched).
- Link-level disclosure must be clear ("(paid link)", "#ad", "#CommissionsEarned") and conspicuous, near the link or review, no hunting for it; must comply with Australian Consumer Law and not mislead (same page, fetched).
- Not verified this session: Amazon's rules on price display, link shortening and emailing links (operating-agreement page 503). Check [operating agreement](https://affiliate-program.amazon.com.au/help/operating/agreement) yourself before showing live prices.
- ACCC: consumers must be able to easily identify sponsored or affiliate content; "#sp"/"#spon" tags are not sufficient; disclosure buried at the end of a long caption or in hard-to-read fonts was the main problem found ([ACCC media release](https://www.accc.gov.au/media-release/scrutiny-of-influencers-and-businesses-for-misleading-advertising-and-online-reviews-continues) via search excerpt; [Clayton Utz](https://www.claytonutz.com/knowledge/2022/august/as-the-accc-announces-a-crackdown-on-influencers-some-dos-and-donts-of-influencer-advertising)). Applies to brands and marketers as well as influencers.
- Practical rule for RoughCut (GUESSED interpretation, not legal advice): site-wide footer statement plus a visible "(paid link)" beside each Amazon link and near the top of any page with affiliate gear, and a "Sponsored" label on any brand slot.
- BBQ site norms: AmazingRibs states it takes no paid articles, no junkets, and runs membership, ads and affiliates ([about](https://amazingribs.com/about-us-how-amazingribscom-works/)). I did not find data on brand partner slots at other BBQ sites (UNVERIFIED).

---

## 7. Google Play notes

- Closed-testing rule for new personal accounts: 12 testers opted in continuously for at least 14 days; applies to personal accounts created after 13 Nov 2023; opt-out then rejoin restarts the 14 days; Production access via application, reviewed typically within 7 days ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465), fetched today, 2026-09-30). Secondary write-ups say it is still current in 2026 ([extendsclass](https://extendsclass.com/blog/google-plays-closed-testing-requirement-what-developers-need-to-know-in-2026), [choicely](https://www.choicely.com/blog/google-play-12-tester-rule)). I did not see the official page's last-updated date; recheck in Play Console before planning. Organisation accounts are widely understood to be exempt (secondary sources only). Cost/benefit note: a registered business account might sidestep the 12-tester wait (GUESSED; needs D-U-N-S and other checks I did not research).
- Webview: Play prohibits apps whose primary purpose is to drive affiliate traffic to a website or provide a webview of a website without owner permission ([Spam policy](https://support.google.com/googleplay/android-developer/answer/9899034?hl=en), fetched). Google's blog calls bare website-wrappers "webview spam" and says to add what users can do better than on the web ([Android Developers Blog](https://android-developers.googleblog.com/2020/10/developer-tips-and-guides-common-policy.html)). Minimum-functionality flags broken or minimal apps (same post; 2020 post, still the best available blog).
- RoughCut risk (GUESSED but material): a plain webview of your site plus Amazon affiliate links is close to both prohibited patterns. You own the site, so permission is met, but "primary purpose affiliate traffic" and "just a webview" remain risks. Mitigation: native/offline cook mode, local notifications, saved plans, offline calculator; keep affiliate links secondary.
- Trusted Web Activity option: TWAs need PWA installability and (per Chrome docs excerpt) a Lighthouse performance score of 80, and must follow Play policy incl. payments ([Chrome for Developers](https://developer.chrome.com/docs/android/trusted-web-activity/whats-new); excerpt, older figure, verify current).

---

## What I could not verify / next checks
1. Real Reddit sentiment (r/smoking, r/BBQ): not reachable.
2. Primary-quality sources for cook times (AmazingRibs charts, Franklin, Weber): fetch blocked; rows 10 to 15 unsourced.
3. Full Amazon AU operating agreement and the ACCC page.
4. FSANZ text itself and a state health department page for AU temperatures.
5. Mob and Paprika UI specifics; motion-specific evidence (durations, easing) not found.
6. Whether any competing free calculator supports multi-cut serve-by planning; only anecdotal evidence found.
