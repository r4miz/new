import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceBySlug } from "@/lib/db/workspaces"
import { WorkspaceSettingsForm } from "@/components/settings/WorkspaceSettingsForm"
import Link from "next/link"
import { CreditCard } from "lucide-react"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workspace = await getWorkspaceBySlug(workspaceSlug)
  if (!workspace) redirect("/onboarding")

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your workspace configuration.</p>
      </div>

      {/* Workspace settings */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-5">Workspace</h2>
        <WorkspaceSettingsForm workspace={workspace} />
      </div>

      {/* Quick links */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Other settings</h2>
        <div className="space-y-2">
          <Link
            href={`/w/${workspaceSlug}/settings/billing`}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors group"
          >
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <CreditCard size={15} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Billing & subscription</p>
              <p className="text-xs text-slate-500">Manage your plan, invoices, and payment method</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
