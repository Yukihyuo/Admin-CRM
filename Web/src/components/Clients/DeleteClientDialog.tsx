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
import { Trash2 } from "lucide-react"
import { API_ENDPOINTS } from "@/config/api"
import { getFullName, type ClientUser } from "@/components/Clients/client.types"

interface DeleteClientDialogProps {
  client: ClientUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function DeleteClientDialog({ client, open, onOpenChange, onSuccess }: DeleteClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const response = await axios.delete(API_ENDPOINTS.CLIENTS.DELETE_BY_ID(client._id))

      toast.success(response.data.message || "Cliente eliminado exitosamente")
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      toast.error(axiosError.response?.data?.message || "Error al eliminar cliente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
              <AlertDialogDescription>
                {getFullName(client)} (@{client.username}) se eliminará de forma permanente, junto con
                sus datos de acceso. Esta acción no se puede deshacer.
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
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? "Eliminando..." : "Sí, eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
