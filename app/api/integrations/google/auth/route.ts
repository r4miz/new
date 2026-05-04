import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { buildGoogleOAuthUrl } from "@/lib/integrations/google-sheets"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspaceId  = searchParams.get("workspace_id")
  const sheetUrl     = searchParams.get("sheet_url")
  const datasetName  = searchParams.get("dataset_name")

  if (!workspaceId || !sheetUrl || !datasetName) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const state = Buffer.from(JSON.stringify({ workspace_id: workspaceId, sheet_url: sheetUrl, dataset_name: datasetName })).toString("base64url")
  return redirect(buildGoogleOAuthUrl(state))
}
