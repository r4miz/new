export interface KnowledgeChunk {
  title:    string
  source:   string
  category: "framework" | "benchmark" | "principle" | "industry"
  industry: string | null
  content:  string
}

export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [

  // ── ALEX HORMOZI ──────────────────────────────────────────────────────────

  {
    title: "The Value Equation — How to Charge More",
    source: "$100M Offers by Alex Hormozi",
    category: "framework",
    industry: null,
    content: `Value = (Dream Outcome × Perceived Likelihood of Achievement) / (Time Delay × Effort & Sacrifice). To charge premium prices: maximize the numerator, minimize the denominator. Dream Outcome: paint the transformation, not the features — what life or business looks like after. Perceived Likelihood: proof (testimonials, case studies, credentials, guarantees) makes them believe it will work for THEM. Time Delay: faster results = more valuable — compress timelines wherever possible. Effort & Sacrifice: remove friction and unpleasant steps. Most businesses compete on price because they fail to engineer value. If a client pays $1,000 and receives $10,000 in value, you can charge $3,000 next time. Audit your offer through this lens: which quadrant is weakest? That is your highest-leverage improvement. Never compete on price — compete on value stack.`,
  },

  {
    title: "Grand Slam Offer — Make Price Irrelevant",
    source: "$100M Offers by Alex Hormozi",
    category: "framework",
    industry: null,
    content: `A Grand Slam Offer is so good that prospects feel stupid saying no. Construction: (1) Identify the single most important dream outcome. (2) List every obstacle between them and that outcome. (3) Create a specific solution for each obstacle — these become offer components. (4) Stack all solutions into one package. (5) Assign believable value to each component. (6) Price the bundle far below the sum of components. (7) Add risk reversal (guarantee). (8) Name it specifically — "The 90-Day Revenue Doubler System" not "Business Consulting." Principle: never sell a commodity, sell a transformation. Instead of "marketing services," sell "47 qualified leads in 30 days or you don't pay." The more specific the outcome and the more obstacles you eliminate, the higher you can charge. A business selling a Grand Slam Offer has no meaningful competition.`,
  },

  {
    title: "Hormozi Pricing Psychology — Charge What You're Worth",
    source: "$100M Offers by Alex Hormozi",
    category: "framework",
    industry: null,
    content: `Hormozi's pricing rules: (1) If you're not uncomfortable with your price, you're too cheap. (2) Raise prices until 1 in 10 prospects says it's too expensive — that's the sweet spot. (3) Higher prices attract better clients who value results and generate better testimonials. (4) Price anchoring: show full value before the price — the price then seems like a steal. (5) Never discount — add more value instead. Discounting trains clients to wait for deals and signals you don't believe in your own value. (6) Payment plans increase conversions: $5,000 up front vs $500/month for 12 months — same revenue, 3× more buyers. (7) Charge for outcomes, not hours. Hourly billing commoditizes you and caps income. Reframe: "If I guarantee you $100,000 in new revenue, what is that worth?" This conversation transforms pricing objections into value conversations.`,
  },

  {
    title: "Guarantees & Risk Reversal — Remove Every Reason to Say No",
    source: "$100M Offers by Alex Hormozi",
    category: "framework",
    industry: null,
    content: `Guarantees eliminate buyer risk and dramatically increase conversions. Types: (1) Unconditional — full refund, no questions (highest conversions, lower fraud risk than feared). (2) Conditional — "If you complete steps X, Y, Z and don't get result, full refund" (protects against non-doers). (3) Anti-guarantee — "No refunds" with premium ultra-specific positioning. (4) Implied — reputation and social proof carry the trust. Hormozi's insight: the revenue lost from not closing without a guarantee far exceeds refunds. Strongest guarantee: "If you don't add $50K in ARR within 90 days following our system, I'll refund every penny and work free until you do." This only works when you believe in your product — and forces you to build a better one. Calculate your actual refund rate vs. your conversion lift from adding a guarantee. For most businesses this math is overwhelmingly positive.`,
  },

  {
    title: "Core Four — The Only Four Ways to Acquire Customers",
    source: "$100M Leads by Alex Hormozi",
    category: "framework",
    industry: null,
    content: `Every customer acquired comes through exactly four activities: (1) Warm Outreach — reach out to people who already know you (fastest path to first revenue). (2) Post Content — create content that attracts leads passively (12+ months to compound but best long-term ROI). (3) Cold Outreach — reach out to strangers matching your ideal customer profile (scales fastest for B2B high-ticket). (4) Paid Ads — pay to put your message in front of prospects (most scalable but requires a proven offer first). Rule: master ONE channel completely before adding others. Most businesses fail by doing all four at 25% effort. Leads formula: Engaged Leads = Total Leads × Conversion Rate. To double revenue: double leads, OR double conversion rate, OR double transaction value — focus on whichever is cheapest. Paid ads should never run to an unproven offer — prove the offer with warm and cold outreach first.`,
  },

  {
    title: "Niche Selection & The Starving Crowd",
    source: "$100M Offers & Gym Launch Secrets by Alex Hormozi",
    category: "framework",
    industry: null,
    content: `Market selection is the most important business decision. Criteria for a great market: (1) Massive ongoing pain — they desperately need a solution. (2) Purchasing power — they have money and will spend it. (3) Easy to find — reachable in one channel (forums, trade shows, lists). (4) Growing market — the tide rises. The Starving Crowd principle: a mediocre offer to a starving crowd beats a brilliant offer to a satisfied crowd. Niching down creates premium pricing: "business consultant" charges $100/hr; "SaaS customer retention consultant" charges $500/hr. Niching formula: ONE customer avatar, ONE pain, ONE solution, ONE channel. Fire your bottom 20% of clients — they consume disproportionate time, pay late, and refer nobody. Your top 20% by revenue and ease deserve 80% of your attention. Build your entire marketing around attracting more of your ideal 20%.`,
  },

  {
    title: "Unit Economics — The Numbers Every Business Owner Must Know",
    source: "Gym Launch Secrets & Acquisition.com by Alex Hormozi",
    category: "framework",
    industry: null,
    content: `Critical unit economics: (1) CAC (Customer Acquisition Cost): total marketing + sales spend ÷ new customers acquired. (2) LTV (Lifetime Value): avg transaction × purchase frequency × avg customer lifespan. (3) LTV:CAC ratio must be 3:1 minimum; 5:1 is healthy; 10:1+ is a growth engine. (4) Payback period: months to recoup CAC — under 12 months for most businesses. (5) Gross Margin: must be 50%+ for services, 30%+ for products before any business makes sense. Business model principles: sell something once, deliver ongoing value (subscriptions beat transactions). Front-end offers acquire customers; back-end offers create profit. Ascension model: low-ticket → medium-ticket → high-ticket → retainer. Common mistake: measuring revenue instead of profit. A $1M revenue business at 5% margin is worse than a $400K business at 40% margin. Always optimize for profit per customer, not revenue per customer.`,
  },

  // ── TOP BUSINESS BOOKS ───────────────────────────────────────────────────

  {
    title: "Hedgehog Concept & Flywheel — Good to Great",
    source: "Good to Great by Jim Collins",
    category: "framework",
    industry: null,
    content: `The Hedgehog Concept: great companies operate at the intersection of three circles — (1) What you are deeply passionate about, (2) What you can be the best in the world at, (3) What drives your economic engine. The single most important economic question: "What is our profit per X?" For most businesses: profit per customer, per employee, or per location. The Flywheel: sustained greatness never comes from one dramatic decision but from thousands of small pushes on a flywheel that compound into unstoppable momentum. Each push builds on the last. Level 5 Leadership: the most effective leaders combine fierce professional will with personal humility — they credit others for success and take personal blame for failures. First Who, Then What: get the right people on the bus before deciding direction. Wrong people with the right strategy will fail. Right people will figure out the right strategy.`,
  },

  {
    title: "Building a Monopoly — Zero to One",
    source: "Zero to One by Peter Thiel",
    category: "framework",
    industry: null,
    content: `Thiel's thesis: competition is for losers. Build a monopoly — unique enough that no one can take your market. Monopoly characteristics: (1) Proprietary technology — 10× better than nearest alternative (not 10% better, 10×). (2) Network effects — product becomes more valuable as more people use it. (3) Economies of scale — fixed costs spread over growing revenue. (4) Branding — unique perception that cannot be replicated. Start in a small market and dominate it completely before expanding. The 7 questions every business must answer: Engineering (can you create breakthrough tech?), Timing (is now the right moment?), Monopoly (big share of small market?), People (right team?), Distribution (can you reach buyers?), Durability (defensible in 10-20 years?), Secret (unique opportunity others don't see?). Going from 0→1 (creating something new) is harder and more valuable than 1→N (copying what already works).`,
  },

  {
    title: "Bullseye Framework — Finding Your Traction Channel",
    source: "Traction by Gabriel Weinberg & Justin Mares",
    category: "framework",
    industry: null,
    content: `19 traction channels exist: Viral Marketing, PR, Unconventional PR, SEM, Social/Display Ads, Offline Ads, SEO, Content Marketing, Email Marketing, Engineering as Marketing, Business Development, Sales, Affiliate Programs, Existing Platforms, Trade Shows, Offline Events, Speaking, Community Building, Targeting Blogs. Bullseye Framework: (1) Brainstorm all channels that could work. (2) Rank top 3 most promising by cost, speed, and fit. (3) Run cheap fast experiments in all 3 simultaneously. (4) Double down on the one winner. Rule: at every growth stage, one channel dominates — find it and exploit it until saturation, then find the next. Most businesses fail by spreading thinly across many channels. The channel that works for your competitor may not work for you — test empirically. Early-stage companies should allocate 50% of time to traction. No product survives without distribution.`,
  },

  {
    title: "Build-Measure-Learn & The Pivot",
    source: "The Lean Startup by Eric Ries",
    category: "framework",
    industry: null,
    content: `Build-Measure-Learn: (1) Build the smallest version that tests your core assumption (MVP). (2) Measure real customer behavior — not surveys, but actions. (3) Learn whether to persevere or pivot. Minimize total time through the loop, not time in any one phase. An MVP is not a cheap product — it's a vehicle for learning. Validated Learning: progress is measured by what you learn about what customers actually want, not by features shipped. The Pivot: changing direction while staying grounded in learning from data. Types: customer segment pivot, problem pivot, platform pivot, business model pivot, channel pivot, technology pivot. Vanity metrics (total users, raw revenue) vs. actionable metrics (cohort retention, revenue per customer). For small businesses: your entire business model is the product to test. Test pricing, channel, and customer assumptions before scaling. The biggest waste in business is building something nobody wants.`,
  },

  {
    title: "Work ON the Business, Not IN It — E-Myth",
    source: "The E-Myth Revisited by Michael E. Gerber",
    category: "framework",
    industry: null,
    content: `The E-Myth (Entrepreneurial Myth): most businesses are started by Technicians having an entrepreneurial seizure — a skilled person (plumber, baker, consultant) who starts a business and discovers they now hate their craft because they're also manager and entrepreneur. Three personalities every founder battles: (1) Entrepreneur — lives in the future, creates vision. (2) Manager — lives in the past, creates order and systems. (3) Technician — lives in the present, does the work. Most small business owners: 70% Technician, 20% Manager, 10% Entrepreneur. The Franchise Prototype Mindset: build as if you're franchising 5,000 locations. Every process must be documented and executable by an average employee — never dependent on any specific person. Dedicate non-negotiable weekly time to building systems. A business dependent on the owner is not a business — it's a job with extra stress and liability.`,
  },

  {
    title: "Profit First — The Cash Allocation System",
    source: "Profit First by Mike Michalowicz",
    category: "framework",
    industry: null,
    content: `Traditional formula: Revenue - Expenses = Profit (profit is what's left over, usually zero). Profit First: Revenue - Profit = Expenses (profit is taken first, expenses forced to fit). Five bank accounts: Income (all revenue lands here), Profit (take first), Owner Pay (your salary), Tax (15-20%), Operating Expenses (everything else). Transfer percentages on the 10th and 25th monthly. Target Allocation Percentages by revenue: Under $250K → Profit 5%, Owner Pay 50%, Tax 15%, OpEx 30%. $250K-$500K → Profit 10%, Owner Pay 35%, Tax 15%, OpEx 40%. $500K-$1M → Profit 15%, Owner Pay 20%, Tax 15%, OpEx 50%. $1M-$5M → Profit 10%, Owner Pay 10%, Tax 15%, OpEx 65%. $5M-$10M → Profit 15%, Owner Pay 5%, Tax 15%, OpEx 65%. Start at 1% profit if needed and increase by 1% quarterly. The Profit account is only withdrawn quarterly as a dividend — never for operations.`,
  },

  {
    title: "Start With Why — The Golden Circle",
    source: "Start with Why by Simon Sinek",
    category: "framework",
    industry: null,
    content: `Most companies communicate outside-in: What (product) → How (differentiator) → Why (rarely stated). Inspired companies do the opposite — Why → How → What. The Why is not making money; it's your purpose, cause, or belief. People don't buy what you do — they buy why you do it. Apple's Why: challenge the status quo and think differently. The Mac and iPhone are just what they make. For small businesses: your Why is usually your founder story and the problem you personally set out to solve. Communicate that story authentically in all marketing. Customers who align with your Why become evangelists who sell for you. Hiring application: hire people who believe what you believe — skills can be taught, values cannot. The goal is a team that would work for the mission even if pay were equal elsewhere. The Why also resolves your pricing problem: when people understand WHY you do it, price becomes secondary.`,
  },

  {
    title: "BHAG, Core Values & Clock Building",
    source: "Built to Last by Jim Collins & Jerry Porras",
    category: "framework",
    industry: null,
    content: `Visionary companies do two things: (1) Preserve the core — core values and purpose never change. (2) Stimulate progress — goals, strategies, and tactics constantly evolve. BHAG (Big Hairy Audacious Goal): a clear, compelling, long-term goal that energizes an organization for 10-30 years. Must be audacious but achievable — not a certain win, but a worthy attempt. Clock Building vs. Time Telling: brilliant founders build great products (time telling). Visionary leaders build great organizations that produce great products without them (clock building). "And" not "Or" thinking: great companies don't choose between profit AND purpose, short-term AND long-term, growth AND culture. They pursue both simultaneously. For SMBs: document 3-5 core values explicitly. Use them in every hiring decision, promotion, and firing. A business with clear core values attracts the right employees and repels the wrong ones — saving enormous time and cost.`,
  },

  {
    title: "Negotiation Tactics for Business",
    source: "Never Split the Difference by Chris Voss",
    category: "framework",
    industry: null,
    content: `FBI hostage negotiation applied to business deals. Key techniques: (1) Tactical Empathy — understand and articulate the other party's perspective before presenting yours. Opens every difficult conversation. (2) Mirroring — repeat the last 1-3 words as a question. Forces elaboration without revealing your position. (3) Calibrated Questions — "How am I supposed to do that?" transfers the problem back without aggression. (4) Accusation Audit — list every negative thing they might think or say about you, before they say it. Disarms objections preemptively. (5) Anchor first — the first number in any negotiation sets the psychological frame. Anchor high if selling, low if buying. (6) "No" is not rejection — it means "I'm not comfortable, make me more comfortable." For pricing: when asked to lower your price, respond with "How am I supposed to do that?" and wait. Never split the difference — instead find creative trades: payment terms, scope changes, added bonuses — anything except discounting price.`,
  },

  {
    title: "The 80/20 Rule & Systems for Freedom",
    source: "The 4-Hour Workweek by Tim Ferriss",
    category: "framework",
    industry: null,
    content: `The 80/20 Principle: 20% of activities produce 80% of results; 20% of customers generate 80% of revenue. Application: (1) Identify and eliminate the 80% of tasks producing only 20% of results. (2) Identify your top 20% of customers (most revenue, least problems, best referrals) and focus entirely on attracting more of them. (3) Fire or raise prices on the bottom 20% of clients consuming disproportionate energy. EDA Framework: Elimination → Automation → Delegation. Eliminate tasks that shouldn't be done at all. Automate everything that can run without human decision. Delegate everything that doesn't require your specific expertise. The goal: systems that run without constant owner input. Low Information Diet: most business "news" is noise that creates anxiety without improving decisions. Batch email and meetings into defined time blocks — never check email first thing in the morning. For SMBs: what are your 3 highest-value activities? Protect those hours at all costs.`,
  },

  // ── INDUSTRY BENCHMARKS ───────────────────────────────────────────────────

  {
    title: "SaaS Metrics & Benchmarks",
    source: "Industry Benchmarks — SaaS",
    category: "benchmark",
    industry: "saas",
    content: `Key SaaS benchmarks: Monthly Churn: under 2% monthly is good; under 0.5% for enterprise. Net Revenue Retention (NRR): 100% = flat; 110%+ = growing without new customers; 120%+ = best-in-class. Gross Margin: 70-80%+ is standard for SaaS. LTV:CAC ratio: 3:1 minimum; 5:1 healthy; 10:1+ exceptional. CAC Payback: under 18 months for VC-backed; under 12 months for bootstrapped. Magic Number (Sales Efficiency): 0.75+ means scale sales spend. Rule of 40: growth rate % + profit margin % should exceed 40 for a healthy SaaS business. ARR milestones: $1M ARR in 2-3 years is solid for bootstrapped; VC-backed targets $1M ARR by Series A. Expansion Revenue: best SaaS companies get 20-30% of new MRR from existing customer upgrades. Average Contract Value: enterprise $10K+/yr; SMB $1K-10K/yr. Early warning signs of trouble: churn above 3% monthly, NRR below 90%, CAC payback over 24 months.`,
  },

  {
    title: "E-commerce Metrics & Benchmarks",
    source: "Industry Benchmarks — E-commerce",
    category: "benchmark",
    industry: "ecommerce",
    content: `Key e-commerce benchmarks: Gross Margin: 40-60% for physical goods; 60-80% for digital/info products. Conversion Rate: 1-3% industry average; above 3% is strong; below 1% signals pricing or UX problems. Average Order Value (AOV): focus on growing 20-30% via bundles, upsells, and minimum order thresholds. Email Revenue: email should drive 25-40% of total revenue. Cart Abandonment: industry average 70-75%; reducing to 60% is high impact. Repeat Purchase Rate: 25-30% buying again within 12 months is average; 40%+ is strong. LTV goal: 3× AOV minimum (3 purchases per customer). ROAS threshold: if gross margin is 50%, you need minimum 2× ROAS just to break even on ads. Return Rate: under 10% healthy; over 25% signals product-quality or expectation mismatch. Top metric to optimize: Revenue per Visitor (RPV) = Conversion Rate × AOV. Free shipping at threshold increases AOV 15-25% on average. SMS open rates 95%+ vs email 20-30% — use SMS for highest-value offers.`,
  },

  {
    title: "Restaurant & Food Service Benchmarks",
    source: "Industry Benchmarks — Food & Beverage",
    category: "benchmark",
    industry: "restaurant",
    content: `Key restaurant and food service benchmarks: Food Cost: 28-35% of revenue; fine dining 25-30%; fast casual 25-32%. Labor Cost: 25-35% including all labor. Prime Cost (Food + Labor combined): must be under 65%; under 60% is strong. Rent: should not exceed 10% of revenue; 6-8% is ideal — choose location accordingly. Net Profit Margin: 3-9% for full-service; 6-9% fast casual; below 3% is survival mode. Table Turns: full-service targets 2-3 turns per table per service period. Beverage Margin: cocktails 80%+; beer 75-80%; wine 65-70% — always push beverage. Third-Party Delivery: platforms take 20-35% commission — calculate true margin before accepting orders. Staff Turnover: industry average 73% annually — high turnover costs $3K-$15K per employee to replace. Technology: POS analytics reveal daypart profitability — schedule staff and run promotions during slow periods. Upselling dessert and beverages can increase average check 15-20%. Break-even: Fixed costs ÷ (1 - Prime Cost %).`,
  },

  {
    title: "Professional Services Benchmarks",
    source: "Industry Benchmarks — Consulting, Legal, Accounting, Agencies",
    category: "benchmark",
    industry: "professional_services",
    content: `Key professional services benchmarks: Billable Utilization Rate: 70-80% of available hours should be billable; under 60% is waste; over 85% causes burnout and zero time for business development. Realization Rate: what you collect vs. what you bill — should be 90%+. Revenue per Employee: $150K-$300K for mid-market; $300K+ for premium boutique firms. Project Gross Margin: 40-60% after direct labor costs. Client Concentration: no single client over 25% of revenue — if they leave, you're in crisis. Sales Cycle: enterprise clients 3-12 months; SMB clients 2-6 weeks. Annual Client Retention: 80%+ is excellent; below 70% signals delivery problems. Pricing evolution: hourly (commoditized) → project-based → value-based. Value-based example: if advice saves a client $500K, charging $50K (10%) is easily justified. Client acquisition: referrals from happy clients should represent 40-60% of new business in a healthy firm. Invest in client success — 5-10× cheaper than acquiring new clients.`,
  },

  {
    title: "Retail Industry Benchmarks",
    source: "Industry Benchmarks — Retail",
    category: "benchmark",
    industry: "retail",
    content: `Key retail benchmarks: Gross Margin: 25-50% depending on category; luxury 55-65%; commodities 10-20%. Inventory Turnover: varies widely — faster is better; compare against category-specific averages. GMROI (Gross Margin Return on Inventory Investment): over 3.0 is strong for most retail. Sell-Through Rate: 80%+ within season is excellent; below 60% triggers markdowns that kill margin. Shrinkage (theft + waste): industry average 1.5-2% of revenue; above 3% is a serious problem. Revenue per Square Foot: $300+ annually is good for most retail; $500+ for premium/specialty. Conversion Rate (of foot traffic): 20-40% is typical in-store; very location and category dependent. Return Rate: under 10% for in-store; 15-30% for online retail. Digital presence: stores with strong online + in-store integration see 30%+ higher LTV. Loyalty programs: top 20% of loyalty members typically generate 60-80% of revenue. Key expenses to control: rent (under 15% of revenue), labor (under 25%), marketing (5-10%).`,
  },

  {
    title: "Fitness & Gym Industry Benchmarks",
    source: "Industry Benchmarks — Fitness",
    category: "benchmark",
    industry: "fitness",
    content: `Key fitness benchmarks: Monthly Revenue per Member: boutique studio $150-300; traditional gym $30-60; CrossFit/specialty $150-250. Monthly Attrition Rate: boutique studios 5-8%; traditional gyms 3-5%; under 3% is excellent. LTV formula: Monthly Revenue ÷ Monthly Churn Rate. At $200/month with 5% churn = $4,000 LTV. Member Acquisition Cost: $100-300 via referral/organic; $200-500 via paid. Referral Rate: 30-40% of new members from referrals in a healthy studio — build a formal referral program. Personal Training Attachment: 15-25% of members adding PT significantly increases LTV. Revenue Streams ranked by margin: (1) Memberships, (2) Personal training (highest margin), (3) Nutrition coaching, (4) Challenges/programs, (5) Merchandise. Payroll: 35-45% of revenue. Break-even: most boutique studios need 80-120 active members at $150-200/month. Hormozi's Gym Launch insight: the offer creates the gym, not the other way around. The transformation is the product, not the facility.`,
  },

  {
    title: "Marketing Agency Benchmarks",
    source: "Industry Benchmarks — Marketing Agencies",
    category: "benchmark",
    industry: "agency",
    content: `Key marketing and creative agency benchmarks: Gross Margin: 40-60% on client revenue after direct costs (freelancers, tools, ad spend managed). Net Profit Margin: 15-25% for well-run agencies. Utilization Rate: 70-75% billable for staff. Revenue per Employee: $150K-$250K for established agencies; below $100K signals over-staffing. Annual Client Retention: 80%+ excellent; below 70% signals delivery or expectation problems. Pitch Win Rate: 25-35% is strong; below 20% signals mis-targeting or weak positioning. Business model evolution: Project (unpredictable) → Retainer (predictable) → Performance-based (scales with client growth) → Productized service (standardized, scalable). Scope creep is the biggest margin killer — document and invoice all work outside original scope. Price increases: raise rates 10-20% annually; most agencies are underpriced by 30-50%. Specialization premium: "Facebook Ads Agency for E-commerce" charges 2-3× more than a generic marketing agency. New business development should consume 20% of leadership time consistently.`,
  },

  {
    title: "General SMB Financial Benchmarks",
    source: "Industry Benchmarks — Small & Mid-Sized Business",
    category: "benchmark",
    industry: null,
    content: `Universal SMB benchmarks: Gross Profit Margin by industry: Retail 25-35%; Restaurants 60-70% on menu price; SaaS 70-80%; Professional Services 50-70%; Manufacturing 25-35%; Construction 15-25%. Operating Profit Margin: healthy SMB 10-20%; under 5% is survival mode. Owner's Compensation: should not exceed 30-50% of pre-owner profit for a scalable business. Working Capital Ratio (Current Assets ÷ Current Liabilities): 1.5-2.0 is healthy; below 1.0 is danger. Accounts Receivable Days: under 30 excellent; 30-45 normal; over 60 means cash flow problems. Cash Reserve: 3-6 months of operating expenses in liquid cash — not invested, liquid. Revenue per Employee: $150K+ for service businesses; $250K+ indicates good operational leverage. EBITDA Margin: 15-25% for well-run small businesses. Business Valuation: typically 2-5× EBITDA for service businesses; 5-10× for high-growth recurring revenue businesses. Rule of thumb: a business worth acquiring generates 20%+ EBITDA margin with owner independence.`,
  },

  // ── UNIVERSAL BUSINESS PRINCIPLES ────────────────────────────────────────

  {
    title: "Customer LTV & Retention — The Growth Engine",
    source: "Business Principles",
    category: "principle",
    industry: null,
    content: `LTV drivers in order of impact: (1) Reduce churn — keeping customers is 5-10× cheaper than acquiring new ones. (2) Increase purchase frequency — loyalty programs, subscriptions, proactive outreach. (3) Increase average transaction value — upsells, bundles, premium tiers. (4) Extend lifespan — better onboarding, community, proactive support. Churn early warning signals: declining login frequency, support tickets, late payments, competitor mentions. The save intervention: identify at-risk customers and personally reach out before they cancel — a personal call has 50-70% save rates. NPS detractors (0-6 scores) are actively referring people AWAY from you — address them urgently. Pareto of customers: top 20% generate 80% of revenue. Profile them, market exclusively to attract more of that profile, and fire the bottom 20% who drain energy. Referral program math: a customer acquired via referral has 16-25% higher LTV and refers more themselves — systematize referrals immediately.`,
  },

  {
    title: "Cash Flow Management — The Survival Skill",
    source: "Business Principles",
    category: "principle",
    industry: null,
    content: `Cash flow kills more profitable businesses than losses do. Profit ≠ Cash — you can be profitable on paper and insolvent in reality. Cash flow rules: (1) Invoice immediately — every day of delay costs you cash. (2) Net-30 terms cost you real money — offer 2% discount for payment within 10 days, or move to Net-15. (3) Require 25-50% deposits on all project work before starting. (4) Weekly 8-week cash flow forecast: list all expected inflows and outflows — if you see a gap, act 8 weeks before it arrives. (5) Separate business and personal accounts — commingling is the #1 SMB accounting disaster. (6) Cash reserve: maintain 90 days of operating expenses in liquid accounts, not 30 days. (7) Line of credit: get it when you don't need it — banks lend to businesses with cash, not those desperate for it. (8) Tax allocation: set aside 25-30% of every profit dollar for taxes quarterly. Break-even formula: Fixed Costs ÷ Gross Margin % = break-even revenue required.`,
  },

  {
    title: "Sales Fundamentals for Small Business",
    source: "Business Principles",
    category: "principle",
    industry: null,
    content: `Sales truths every SMB owner must internalize: (1) People buy from people they trust — trust is built by genuine interest in their problem, not in selling. (2) Qualify first — 90% of sales problems are targeting problems. Only talk to people with the pain, money, authority, and urgency to buy. (3) Conversation structure: Rapport → Diagnose pain → Amplify consequences → Present solution → Handle objections → Close → Follow up. (4) Price objections are almost always value objections — "too expensive" means "I don't see enough value." (5) Follow-up wins deals — 80% of sales happen between the 5th and 12th contact; most salespeople quit after 2. (6) Proposal without discovery is guessing — always diagnose before prescribing. (7) Social proof at every stage: testimonials, case studies, specific results. (8) Clear next step close: "Does Tuesday at 2pm work to review this together?" (9) Track conversion at each stage (leads → qualified → proposed → closed) to identify your biggest bottleneck and fix only that.`,
  },

  {
    title: "Pricing Strategy for Any Business",
    source: "Business Principles",
    category: "principle",
    industry: null,
    content: `Pricing frameworks: (1) Cost-plus: cost + markup (floor, never ceiling — most businesses underprice this way). (2) Competitive: match market rates (commoditizes you). (3) Value-based: price based on value delivered to the customer (correct approach for most businesses). (4) Penetration: low price to capture market share (only works with a clear path to profitability). (5) Premium: high price signals quality (self-fulfilling in many markets). Value-based pricing math: if your product saves a client $100K, charging $10K (10%) is conservative. If it generates $500K in revenue, charging $50K (10%) is the floor, not ceiling. Price increase test: raise prices 10% on your next 10 prospects. If no increase in no's, raise again. Stop when 1 in 10 objects — that's your market price. Psychological pricing: $997 vs $1,000 matters less than the value story you tell before showing any number. Anchor high: always show the full value (or a higher tier) before revealing your price.`,
  },

]
