import { useAuthStore } from '@/store/authStore';
import { useModulesStore } from '@/store/modulesStore';
import React from 'react'

type Props = {
  children: React.ReactNode;
  page: string;
  type?: string;
  method: "hide" | "block";
}

export default function ProtectedModule({ children, page, type, method }: Props) {
  const { modules } = useModulesStore()
  const { getPermissions } = useAuthStore()
  const userModules = getPermissions()

  const pageModules = modules.length > 0 ? modules.filter(mod => mod.page === page && mod.type === type) : []
  const ids = new Set(pageModules.map(mod => mod._id))

  const hasAccess = userModules ?
    userModules.some(modId => ids.has(modId)) :
    false

  if (!hasAccess && method === "hide") {
    return null
  }

  if (!hasAccess && method === "block") {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded">
        <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
        <p>You do not have permission to view this module.</p>
      </div>
    )
  }

  return (
    <>{children}</>
  )
}