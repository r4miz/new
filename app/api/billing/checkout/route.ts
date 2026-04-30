import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"
import { PLANS, type PlanKey } from "@/lib/billing"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { workspace_id, plan } = await request.json()
  if (!workspace_id || !plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { data: workspace } = await adminClient
    .from("workspaces")
    .select("id, slug, stripe_customer_id")
    .eq("id", workspace_id)
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const priceId = process.env[`STRIPE_${plan.toUpperCase()}_PRICE_ID`]
  if (!priceId) return NextResponse.json({ error: "Plan not configured" }, { status: 500 })

  // Get or create Stripe customer
  let customerId = workspace.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { workspace_id, user_id: user.id },
    })
    customerId = customer.id
    await adminClient
      .from("workspaces")
      .update({ stripe_customer_id: customerId })
      .eq("id", workspace_id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}/w/${workspace.slug}/dashboard?billing=success`,
    cancel_url: `${appUrl}/w/${workspace.slug}/settings/billing`,
    metadata: { workspace_id, plan },
    subscription_data: { metadata: { workspace_id, plan } },
  })

  return NextResponse.json({ url: session.url })
}
