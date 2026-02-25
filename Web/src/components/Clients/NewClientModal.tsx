import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { toast } from "react-toastify"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/config/api"
import { useAuthStore } from "@/store/authStore"

// Schema de validación con Zod
const clientSchema = z.object({
  email: z.string()
    .min(1, "El email es requerido")
    .email("Email inválido"),
  names: z.string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  lastNames: z.string()
    .min(1, "Los apellidos son requeridos")
    .max(50, "Los apellidos no pueden exceder 50 caracteres"),
  phone: z.string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface NewClientModalProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export default function NewClientModal({ onSuccess, trigger }: NewClientModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const activeStoreId = useAuthStore((state) => state.getActiveStoreId())

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ClientFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      email: "",
      names: "",
      lastNames: "",
      phone: "",
    },
  })

  const emailValue = watch("email")

  // Generar username desde email (texto antes del @)
  const generateUsername = (email: string): string => {
    const atIndex = email.indexOf('@')
    if (atIndex > 0) {
      return email.substring(0, atIndex)
    }
    return email
  }

  const onSubmit = async (data: ClientFormValues) => {
    if (!activeStoreId) {
      toast.error("No hay una tienda activa seleccionada")
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post(API_ENDPOINTS.CLIENTS.REGISTER, {
        email: data.email,
        storeId: activeStoreId,
        profile: {
          names: data.names,
          lastNames: data.lastNames,
          phone: data.phone || ''
        }
      })

      const username = generateUsername(data.email)
      
      toast.success(response.data.message || "Cliente creado exitosamente")
      toast.info(`Usuario: ${username} | Contraseña: ${username}`, { autoClose: 10000 })
      
      // Reset form y cerrar modal
      reset()
      setOpen(false)
      
      // Callback de éxito
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Error al crear cliente"
        toast.error(message)
      } else {
        toast.error("Error inesperado al crear cliente")
      }
      console.error("Error al crear cliente:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>Nuevo Cliente</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo cliente. El usuario y contraseña se generarán automáticamente desde el email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Campo Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              {emailValue && emailValue.includes('@') && (
                <p className="text-xs text-green-600">
                  Usuario generado: {generateUsername(emailValue)}
                </p>
              )}
            </div>

            {/* Campo Nombres */}
            <div className="grid gap-2">
              <Label htmlFor="names">
                Nombres <span className="text-red-500">*</span>
              </Label>
              <Input
                id="names"
                placeholder="Juan Carlos"
                {...register("names")}
                disabled={isLoading}
              />
              {errors.names && (
                <p className="text-sm text-red-500">{errors.names.message}</p>
              )}
            </div>

            {/* Campo Apellidos */}
            <div className="grid gap-2">
              <Label htmlFor="lastNames">
                Apellidos <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastNames"
                placeholder="Pérez García"
                {...register("lastNames")}
                disabled={isLoading}
              />
              {errors.lastNames && (
                <p className="text-sm text-red-500">{errors.lastNames.message}</p>
              )}
            </div>

            {/* Campo Teléfono */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                {...register("phone")}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> El usuario y contraseña se generarán automáticamente usando el email (texto antes de @). El cliente deberá cambiar su contraseña en el primer inicio de sesión.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
