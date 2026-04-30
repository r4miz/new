import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { workspace_id } = await request.json()

  const { data: workspace } = await adminClient
    .from("workspaces")
    .select("slug, stripe_customer_id")
    .eq("id", workspace_id)
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!workspace?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${appUrl}/w/${workspace.slug}/settings/billing`,
  })

  return NextResponse.json({ url: session.url })
}
