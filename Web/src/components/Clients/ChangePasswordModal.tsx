import { useEffect, useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/config/api"
import type { ClientUser } from "@/components/Clients/client.types"

const passwordSchema = z.object({
  newPassword: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(72, "La contraseña no puede exceder 72 caracteres"),
  confirmPassword: z.string()
    .min(1, "Confirma la contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type PasswordFormValues = z.infer<typeof passwordSchema>

interface ChangePasswordModalProps {
  client: ClientUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function ChangePasswordModal({ client, open, onOpenChange, onSuccess }: ChangePasswordModalProps) {
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema) as never,
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (open) {
      reset({ newPassword: "", confirmPassword: "" })
    }
  }, [open, reset])

  const onSubmit = async (data: PasswordFormValues) => {
    setIsSaving(true)

    try {
      const response = await axios.put(API_ENDPOINTS.CLIENTS.RESET_PASSWORD(client._id), {
        newPassword: data.newPassword,
      })

      toast.success(response.data.message || "Contraseña actualizada exitosamente")
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      toast.error(axiosError.response?.data?.message || "Error al cambiar la contraseña")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Define la nueva contraseña de @{client.username}. Debe tener al menos 6 caracteres y ser
            distinta a la actual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="client-new-password">
                Nueva contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="client-new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                disabled={isSaving}
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-sm text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client-confirm-password">
                Confirmar contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="client-confirm-password"
                type="password"
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                disabled={isSaving}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
