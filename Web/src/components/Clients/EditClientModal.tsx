import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios, { type AxiosError } from "axios"
import { toast } from "react-toastify"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import { API_ENDPOINTS } from "@/config/api"
import { getFullName, getInitials, type ClientUser } from "@/components/Clients/client.types"

const clientSchema = z.object({
  email: z.string()
    .min(1, "El correo es requerido")
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

interface EditClientModalProps {
  client: ClientUser
  mode?: "details" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function EditClientModal({ client, mode = "details", open, onOpenChange, onSuccess }: EditClientModalProps) {
  const [isEditing, setIsEditing] = useState(mode === "edit")
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as never,
    defaultValues: {
      email: "",
      names: "",
      lastNames: "",
      phone: "",
    },
  })

  const fillForm = useCallback((target: ClientUser) => {
    reset({
      email: target.email ?? "",
      names: target.profile?.names ?? "",
      lastNames: target.profile?.lastNames ?? "",
      phone: target.profile?.phone ?? "",
    })
  }, [reset])

  useEffect(() => {
    if (!open) {
      return
    }

    setIsEditing(mode === "edit")
    fillForm(client)
  }, [open, mode, client, fillForm])

  const onSubmit = async (data: ClientFormValues) => {
    if (!isEditing) {
      return
    }

    setIsSaving(true)

    try {
      const response = await axios.put(API_ENDPOINTS.CLIENTS.UPDATE_BY_ID(client._id), {
        email: data.email.trim(),
        profile: {
          names: data.names,
          lastNames: data.lastNames,
          phone: data.phone?.trim() ?? "",
        },
      })

      toast.success(response.data.message || "Cliente actualizado exitosamente")
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      toast.error(axiosError.response?.data?.message || "Error al actualizar cliente")
    } finally {
      setIsSaving(false)
    }
  }

  const readOnlyClass = isEditing ? "" : "bg-muted cursor-default"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-3 text-left">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-medium">{getInitials(client)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="truncate">
                {isEditing ? "Editar cliente" : getFullName(client)}
              </DialogTitle>
              <DialogDescription className="truncate">
                {isEditing ? `Actualiza los datos de @${client.username}` : `@${client.username}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="edit-client-email">
                Correo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-client-email"
                type="email"
                placeholder="cliente@ejemplo.com"
                readOnly={!isEditing}
                disabled={isSaving}
                className={readOnlyClass}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  El usuario del cliente se regenera a partir del correo.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-client-names">
                Nombres <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-client-names"
                placeholder="Juan Carlos"
                readOnly={!isEditing}
                disabled={isSaving}
                className={readOnlyClass}
                {...register("names")}
              />
              {errors.names && (
                <p className="text-sm text-red-500">{errors.names.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-client-lastNames">
                Apellidos <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-client-lastNames"
                placeholder="Pérez García"
                readOnly={!isEditing}
                disabled={isSaving}
                className={readOnlyClass}
                {...register("lastNames")}
              />
              {errors.lastNames && (
                <p className="text-sm text-red-500">{errors.lastNames.message}</p>
              )}
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="edit-client-phone">Teléfono (opcional)</Label>
              <Input
                id="edit-client-phone"
                placeholder="+1234567890"
                readOnly={!isEditing}
                disabled={isSaving}
                className={readOnlyClass}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border bg-muted/40 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="text-sm font-medium">{client.status ? "Activo" : "Inactivo"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Usuario</p>
              <p className="truncate text-sm font-medium">@{client.username}</p>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false)
                  fillForm(client)
                } else {
                  onOpenChange(false)
                }
              }}
              disabled={isSaving}
            >
              {isEditing ? "Cancelar" : "Cerrar"}
            </Button>

            {/* Ambos botones permanecen montados para que React nunca cambie el `type`
                de un botón ya renderizado (eso dispararía el submit del formulario). */}
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
              className={isEditing ? "hidden" : ""}
            >
              <Pencil className="h-4 w-4" />
              Editar cliente
            </Button>

            <Button
              type="submit"
              disabled={!isEditing || isSaving}
              className={isEditing ? "" : "hidden"}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
