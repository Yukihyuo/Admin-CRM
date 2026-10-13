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
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'

import { PageHeader } from '@/components/global/PageHeader'
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
import ChangePasswordModal from '@/components/Clients/ChangePasswordModal'
import DeleteClientDialog from '@/components/Clients/DeleteClientDialog'
import EditClientModal from '@/components/Clients/EditClientModal'
import NewClientModal from '@/components/Clients/NewClientModal'
import ToggleClientStatusDialog from '@/components/Clients/ToggleClientStatusDialog'
import { getFullName, getInitials, type ClientUser } from '@/components/Clients/client.types'
import { API_ENDPOINTS } from '@/config/api'
import { useAuthStore } from '@/store/authStore'

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

interface ActionsMenuProps {
  client: ClientUser
  onSuccess: () => void
}

type ClientAction = "details" | "edit" | "password" | "status" | "delete" | null

function ActionsMenu({ client, onSuccess }: ActionsMenuProps) {
  const [action, setAction] = useState<ClientAction>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acciones de {client.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setAction("details")}>
            <Eye className="h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAction("edit")}>
            <Pencil className="h-4 w-4" />
            Editar cliente
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAction("password")}>
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuItem
            variant={client.status ? "destructive" : "default"}
            onSelect={() => setAction("status")}
          >
            {client.status ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            {client.status ? "Desactivar cliente" : "Activar cliente"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setAction("delete")}>
            <Trash2 className="h-4 w-4" />
            Eliminar cliente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditClientModal
        client={client}
        mode="details"
        open={action === "details"}
        onOpenChange={(isOpen) => setAction(isOpen ? "details" : null)}
        onSuccess={onSuccess}
      />
      <EditClientModal
        client={client}
        mode="edit"
        open={action === "edit"}
        onOpenChange={(isOpen) => setAction(isOpen ? "edit" : null)}
        onSuccess={onSuccess}
      />
      <ChangePasswordModal
        client={client}
        open={action === "password"}
        onOpenChange={(isOpen) => setAction(isOpen ? "password" : null)}
      />
      <ToggleClientStatusDialog
        client={client}
        open={action === "status"}
        onOpenChange={(isOpen) => setAction(isOpen ? "status" : null)}
        onSuccess={onSuccess}
      />
      <DeleteClientDialog
        client={client}
        open={action === "delete"}
        onOpenChange={(isOpen) => setAction(isOpen ? "delete" : null)}
        onSuccess={onSuccess}
      />
    </>
  )
}

export default function Page() {
  const [clients, setClients] = useState<ClientUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const brandId = useAuthStore((state) => state.getBrandId())

  const asyncLoad = useCallback(async () => {
    setLoading(true)

    try {
      const response = await axios.get(API_ENDPOINTS.CLIENTS.GET_BY_BRAND(brandId || ""))
      setClients(response.data.clients || [])
    } catch (error) {
      console.error("Error al cargar clientes:", error)
    } finally {
      setLoading(false)
    }
  }, [brandId])

  useEffect(() => {
    asyncLoad()
  }, [asyncLoad])

  const columns: ColumnDef<ClientUser>[] = [
    {
      id: 'client',
      header: 'Cliente',
      accessorFn: (client) => getFullName(client),
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
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Acciones</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ActionsMenu client={row.original} onSuccess={asyncLoad} />
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: clients,
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
          { label: "Gestión de Clientes" }
        ]}
        title="Clientes"
        description={`Administra los clientes del sistema. Total: ${clients.length}`}
        icon={<Users className="h-5 w-5" />}
      />

      <div className="space-y-4">
        {/* Barra de búsqueda y acciones */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <NewClientModal onSuccess={asyncLoad} />
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, correo o usuario..."
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
                    No se encontraron clientes.
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
              <Skeleton key={index} className="h-28 w-full rounded-lg" />
            ))
          ) : rows.length ? (
            rows.map((row) => {
              const client = row.original

              return (
                <div key={row.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="lg">
                        <AvatarFallback className="font-medium">{getInitials(client)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{getFullName(client)}</p>
                        <p className="truncate text-xs text-muted-foreground">@{client.username}</p>
                      </div>
                    </div>
                    <ActionsMenu client={client} onSuccess={asyncLoad} />
                  </div>

                  <p className="mt-4 truncate text-sm text-muted-foreground" title={client.email}>
                    {client.email ? <span className="lowercase">{client.email}</span> : "Sin email"}
                  </p>

                  <div className="mt-3">
                    <StatusBadge status={client.status} />
                  </div>
                </div>
              )
            })
          ) : (
            <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
              No se encontraron clientes.
            </p>
          )}
        </div>

        {/* Paginación */}
        {!loading && totalFiltered > 0 && (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {totalFiltered} cliente(s) en total
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
