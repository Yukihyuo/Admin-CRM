export interface StaffRole {
  roleId: string
  roleName: string
  accessLevel?: string
  scope?: {
    type: string
    targetId?: string
  }
}

export interface StaffProfile {
  names: string
  lastNames: string
  phone?: string
}

export interface StaffUser {
  _id: string
  username: string
  email?: string
  profile: StaffProfile
  status: boolean
  assignments: StaffRole[]
  createdAt?: string
  updatedAt?: string
}

export const getFullName = (user: StaffUser) =>
  `${user.profile?.names ?? ""} ${user.profile?.lastNames ?? ""}`.trim() || user.username

export const getInitials = (user: StaffUser) =>
  `${user.profile?.names?.[0] ?? ""}${user.profile?.lastNames?.[0] ?? ""}`.toUpperCase() || "?"
