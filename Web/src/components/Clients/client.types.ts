export interface ClientProfile {
  names: string
  lastNames: string
  phone?: string
}

export interface ClientUser {
  _id: string
  username: string
  email?: string
  profile: ClientProfile
  status: boolean
  createdAt?: string
  updatedAt?: string
}

export const getFullName = (client: ClientUser) =>
  `${client.profile?.names ?? ""} ${client.profile?.lastNames ?? ""}`.trim() || client.username

export const getInitials = (client: ClientUser) =>
  `${client.profile?.names?.[0] ?? ""}${client.profile?.lastNames?.[0] ?? ""}`.toUpperCase() || "?"
