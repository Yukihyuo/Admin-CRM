import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { API_ENDPOINTS } from '@/config/api'
import { useAuthStore } from '@/store/authStore'

interface SaleItem {
  productId: {
    _id: string
    name: string
    category: string
  }
  name: string
  price: number
  quantity: number
  subtotal: number
}

interface Client {
  profile?: {
    names?: string
    lastNames?: string
  }
  email?: string
}

interface StaffMember {
  profile?: {
    names?: string
    lastNames?: string
  }
  email?: string
}

interface Sale {
  _id: string
  receiptNumber: string
  clientId: Client | null
  userId: StaffMember
  items: SaleItem[]
  totals: {
    subtotal: number
    tax: number
    discount: number
    total: number
  }
  payment: {
    method: string
    amountPaid?: number
    change?: number
  }
  status: string
  createdAt: string
}

interface DetailsSaleModalProps {
  saleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DetailsSaleModal({
  saleId,
  open,
  onOpenChange,
}: DetailsSaleModalProps) {
  const [sale, setSale] = useState<Sale | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const activeStoreId = useAuthStore((state) => state.getActiveStoreId())
  const token = useAuthStore((state) => state.token)

  const loadSaleData = useCallback(async () => {
    if (!saleId || !activeStoreId) return

    setIsLoading(true)
    try {
      const response = await axios.get(
        API_ENDPOINTS.SALES.GET_BY_ID(activeStoreId, saleId),
        {
          headers: {
            Authorization: token,
          },
        }
      )
      setSale(response.data)
    } catch (error) {
      console.error('Error al cargar detalles de venta:', error)
      toast.error('Error al cargar los detalles de la venta')
    } finally {
      setIsLoading(false)
    }
  }, [saleId, activeStoreId, token])

  useEffect(() => {
    if (open && saleId) {
      loadSaleData()
    }
  }, [open, saleId, loadSaleData])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-yellow-100 text-yellow-800',
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
    }
    return labels[method as keyof typeof labels] || method
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalles de Venta</DialogTitle>
          <DialogDescription>
            Información completa del recibo
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando detalles...</p>
          </div>
        ) : sale ? (
          <div className="max-h-[calc(90vh-200px)] overflow-y-auto pr-4">
            <div className="space-y-6">
              {/* Encabezado con información general */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Recibo</p>
                    <p className="text-lg font-semibold">{sale.receiptNumber}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(
                        sale.status
                      )}`}
                    >
                      {sale.status === 'completed'
                        ? 'Completada'
                        : sale.status === 'cancelled'
                          ? 'Cancelada'
                          : 'Reembolsada'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(sale.createdAt)}
                </p>
              </div>

              {/* Información del Cliente y Vendedor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Cliente</p>
                  {sale.clientId ? (
                    <div className="text-sm space-y-1">
                      <p className="font-medium">
                        {sale.clientId.profile?.names || 'N/A'}{' '}
                        {sale.clientId.profile?.lastNames || ''}
                      </p>
                      <p className="text-muted-foreground">{sale.clientId.email}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Venta sin cliente registrado
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Vendedor</p>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {sale.userId.profile?.names || 'N/A'}{' '}
                      {sale.userId.profile?.lastNames || ''}
                    </p>
                    <p className="text-muted-foreground">{sale.userId.email}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de Productos */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Productos</p>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.name}
                            <p className="text-xs text-muted-foreground">
                              {item.productId?.category || 'N/A'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ${item.subtotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Resumen de Totales */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      ${sale.totals.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {sale.totals.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA:</span>
                      <span className="font-medium">
                        ${sale.totals.tax.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {sale.totals.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento:</span>
                      <span className="font-medium">
                        -${sale.totals.discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-2 flex justify-between text-base font-bold">
                    <span>Total:</span>
                    <span>${sale.totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Información de Pago */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Información de Pago</p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Método:</span>
                    <span className="font-medium">
                      {getPaymentMethodLabel(sale.payment.method)}
                    </span>
                  </div>

                  {sale.payment.method === 'cash' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Monto Pagado:</span>
                        <span className="font-medium">
                          ${sale.payment.amountPaid?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      {sale.payment.change && sale.payment.change > 0 && (
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span>Cambio:</span>
                          <span className="font-medium text-green-600">
                            ${sale.payment.change.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No se encontraron datos de la venta</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
