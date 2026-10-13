import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Eye, KeyRound, MoreHorizontal, Pencil, Search, UserCheck, UserX, Users } from 'lucide-react'

import { PageHeader } from '@/components/global/PageHeader'
import ProtectedModule from '@/components/global/ProtectedModule'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ChangePasswordModal from '@/components/users/ChangePasswordModal'
import EditUserModal from '@/components/users/EditUserModal'
import { NewUserModal } from '@/components/users/NewUserModal'
import ToggleUserStatusDialog from '@/components/users/ToggleUserStatusDialog'
import { getFullName, getInitials, type StaffUser } from '@/components/users/staff.types'
import { API_ENDPOINTS } from '@/config/api'
import { useAuthStore } from '@/store/authStore'

const MAX_VISIBLE_ROLES = 2
const SKELETON_ROWS = 5

function StatusBadge({ status }: { status: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
        status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {status ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function RoleBadges({ assignments }: { assignments: StaffUser['assignments'] }) {
  if (!assignments?.length) {
    return <span className="text-xs text-muted-foreground">Sin roles</span>
  }

  const visible = assignments.slice(0, MAX_VISIBLE_ROLES)
  const hidden = assignments.slice(MAX_VISIBLE_ROLES)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((role, index) => (
        <span
          key={role.roleId ?? index}
          title={role.roleName}
          className="inline-flex max-w-[180px] items-center rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium"
        >
          <span className="truncate">{role.roleName}</span>
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          title={hidden.map((role) => role.roleName).join(', ')}
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          +{hidden.length}
        </span>
      )}
    </div>
  )
}

interface ActionsMenuProps {
  user: StaffUser
  onSuccess: () => void
}

type StaffAction = "details" | "edit" | "password" | "status" | null

function ActionsMenu({ user, onSuccess }: ActionsMenuProps) {
  const [action, setAction] = useState<StaffAction>(null)
  const currentUserId = useAuthStore((state) => state.getUserId())
  const isCurrentUser = currentUserId === user._id

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acciones de {user.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setAction("details")}>
            <Eye className="h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
          <ProtectedModule page="Staff" type="update" method="hide">
            <DropdownMenuItem onSelect={() => setAction("edit")}>
              <Pencil className="h-4 w-4" />
              Editar usuario
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAction("password")}>
              <KeyRound className="h-4 w-4" />
              Cambiar contraseña
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant={user.status ? "destructive" : "default"}
              disabled={isCurrentUser}
              onSelect={() => setAction("status")}
            >
              {user.status ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              {user.status ? "Desactivar usuario" : "Activar usuario"}
            </DropdownMenuItem>
          </ProtectedModule>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserModal
        user={user}
        mode="details"
        open={action === "details"}
        onOpenChange={(isOpen) => setAction(isOpen ? "details" : null)}
        onSuccess={onSuccess}
      />
      <EditUserModal
        user={user}
        mode="edit"
        open={action === "edit"}
        onOpenChange={(isOpen) => setAction(isOpen ? "edit" : null)}
        onSuccess={onSuccess}
      />
      <ChangePasswordModal
        user={user}
        open={action === "password"}
        onOpenChange={(isOpen) => setAction(isOpen ? "password" : null)}
      />
      <ToggleUserStatusDialog
        user={user}
        open={action === "status"}
        onOpenChange={(isOpen) => setAction(isOpen ? "status" : null)}
        onSuccess={onSuccess}
      />
    </>
  )
}

export default function Page() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const activeStoreId = useAuthStore((state) => state.getActiveStoreId())

  const asyncLoad = useCallback(async () => {
    setLoading(true)

    try {
      const response = await axios.get(API_ENDPOINTS.STAFF.GET_BY_STORE(activeStoreId || ""))
      setUsers(response.data.users || [])
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
    } finally {
      setLoading(false)
    }
  }, [activeStoreId])

  useEffect(() => {
    asyncLoad()
  }, [asyncLoad])

  const columns: ColumnDef<StaffUser>[] = [
    {
      id: 'user',
      header: 'Usuario',
      accessorFn: (user) => getFullName(user),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="text-xs font-medium">
              {getInitials(row.original)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{getFullName(row.original)}</p>
            <p className="truncate text-xs text-muted-foreground">@{row.original.username}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) =>
        row.original.email ? (
          <span
            title={row.original.email}
            className="block max-w-[240px] truncate text-muted-foreground lowercase"
          >
            {row.original.email}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin email</span>
        ),
    },
    {
      id: 'roles',
      header: 'Roles',
      cell: ({ row }) => <RoleBadges assignments={row.original.assignments} />,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: () => (
        <ProtectedModule page="Staff" type="update" method="hide">
          <span className="block text-right">Acciones</span>
        </ProtectedModule>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ActionsMenu user={row.original} onSuccess={asyncLoad} />
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  const rows = table.getRowModel().rows
  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Gestión de Usuarios" }
        ]}
        title="Staff"
        description={`Administra los usuarios del sistema. Total: ${users.length}`}
        icon={<Users className="h-5 w-5" />}
      />

      <div className="space-y-4">
        {/* Barra de búsqueda y acciones */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ProtectedModule page="Staff" type="create" method="hide">
            <NewUserModal onSuccess={asyncLoad} />
          </ProtectedModule>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario, email o rol..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabla (escritorio) */}
        <div className="hidden overflow-hidden rounded-lg border md:block">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-11">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                  <TableRow key={index} className="hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="py-3">
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Tarjetas (móvil) */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-lg" />
            ))
          ) : rows.length ? (
            rows.map((row) => {
              const user = row.original

              return (
                <div key={row.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="lg">
                        <AvatarFallback className="font-medium">{getInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{getFullName(user)}</p>
                        <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <ActionsMenu user={user} onSuccess={asyncLoad} />
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="truncate text-sm text-muted-foreground" title={user.email}>
                      {user.email ? <span className="lowercase">{user.email}</span> : "Sin email"}
                    </p>
                    <RoleBadges assignments={user.assignments} />
                  </div>

                  <div className="mt-3">
                    <StatusBadge status={user.status} />
                  </div>
                </div>
              )
            })
          ) : (
            <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
              No se encontraron usuarios.
            </p>
          )}
        </div>

        {/* Paginación */}
        {!loading && totalFiltered > 0 && (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {totalFiltered} usuario(s) en total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm font-medium">
                Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
