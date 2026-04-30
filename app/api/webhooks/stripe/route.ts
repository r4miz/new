import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { adminClient } from "@/lib/supabase/admin"

export const config = { api: { bodyParser: false } }

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = request.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    return NextResponse.json({ error: `Webhook verification failed: ${e}` }, { status: 400 })
  }

  // Use loose typing — we only need a few fields from each object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = event.data.object as any

  switch (event.type) {
    case "checkout.session.completed": {
      const wid = (obj.metadata as Record<string, string> | null)?.workspace_id
      if (wid) {
        await adminClient.from("workspaces").update({
          subscription_status: "active",
          stripe_subscription_id: (obj.subscription as string) ?? null,
        }).eq("id", wid)
      }
      break
    }

    case "customer.subscription.updated": {
      const wid = (obj.metadata as Record<string, string> | null)?.workspace_id
      if (wid) {
        const stripeStatus = obj.status as string
        const appStatus =
          stripeStatus === "active"   ? "active" :
          stripeStatus === "past_due" ? "past_due" :
          stripeStatus === "canceled" ? "canceled" : "expired"
        await adminClient.from("workspaces").update({
          subscription_status: appStatus,
        }).eq("id", wid)
      }
      break
    }

    case "customer.subscription.deleted": {
      const wid = (obj.metadata as Record<string, string> | null)?.workspace_id
      if (wid) {
        await adminClient.from("workspaces").update({
          subscription_status: "canceled",
          stripe_subscription_id: null,
        }).eq("id", wid)
      }
      break
    }

    case "invoice.payment_failed": {
      const subId = obj.subscription as string | null
      if (subId) {
        await adminClient.from("workspaces").update({
          subscription_status: "past_due",
        }).eq("stripe_subscription_id", subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
