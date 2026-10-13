import { useState } from "react"
import axios, { type AxiosError } from "axios"
import { toast } from "react-toastify"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserCheck, UserX } from "lucide-react"
import { API_ENDPOINTS } from "@/config/api"
import { getFullName, type StaffUser } from "@/components/users/staff.types"

interface ToggleUserStatusDialogProps {
  user: StaffUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function ToggleUserStatusDialog({ user, open, onOpenChange, onSuccess }: ToggleUserStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isActive = user.status
  const fullName = getFullName(user)

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const response = await axios.put(API_ENDPOINTS.STAFF.UPDATE_STATUS(user._id), {
        status: !isActive,
      })

      toast.success(response.data.message || "Estado actualizado exitosamente")
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      toast.error(axiosError.response?.data?.message || "Error al actualizar el estado del usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3 text-left">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
            >
              {isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            </div>
            <div className="space-y-2">
              <AlertDialogTitle>
                {isActive ? "¿Desactivar este usuario?" : "¿Activar este usuario?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isActive
                  ? `${fullName} (@${user.username}) no podrá iniciar sesión ni registrar movimientos hasta que lo actives de nuevo.`
                  : `${fullName} (@${user.username}) podrá volver a iniciar sesión en el sistema.`}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault()
              handleConfirm()
            }}
            className={isActive ? "bg-destructive text-white hover:bg-destructive/90" : ""}
          >
            {isLoading ? "Procesando..." : isActive ? "Sí, desactivar" : "Sí, activar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
