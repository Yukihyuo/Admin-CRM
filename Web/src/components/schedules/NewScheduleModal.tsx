import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import { Checkbox } from "@/components/ui/checkbox"
import { API_ENDPOINTS } from "@/config/api"
import { useAuthStore } from "@/store/authStore"

// Schema de validación con Zod
const slotSchema = z.object({
  startTime: z.string().min(1, "Hora de inicio requerida"),
  endTime: z.string().min(1, "Hora de fin requerida"),
  label: z.string().optional()
})

const daySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  active: z.boolean(),
  slots: z.array(slotSchema).optional()
})

const scheduleSchema = z.object({
  userId: z.string().min(1, "Debe seleccionar un usuario"),
  validFrom: z.string().min(1, "Fecha de inicio requerida"),
  validUntil: z.string().optional(),
  days: z.array(daySchema)
})

type ScheduleFormValues = z.infer<typeof scheduleSchema>

interface User {
  _id: string
  username: string
  email: string
  profile: {
    names: string
    lastNames: string
  }
}

interface NewScheduleModalProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" }
]

export function NewScheduleModal({ onSuccess, trigger }: NewScheduleModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const activeStoreId = useAuthStore((state) => state.getActiveStoreId())

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch
  } = useForm<ScheduleFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(scheduleSchema) as any,
    defaultValues: {
      userId: "",
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: "",
      days: DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day.value,
        active: false,
        slots: []
      }))
    }
  })

  const { fields: dayFields } = useFieldArray({
    control,
    name: "days"
  })

  const daysValue = watch("days")

  // Cargar usuarios disponibles
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    if (!activeStoreId) {
      setUsers([])
      return
    }

    setIsLoadingUsers(true)
    try {
      const response = await axios.get(API_ENDPOINTS.STAFF.GET_BY_STORE(activeStoreId || ""))
      setUsers(response.data.users || [])
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      toast.error("Error al cargar los usuarios disponibles")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const onSubmit = async (data: ScheduleFormValues) => {
    if (!activeStoreId) {
      toast.error("No hay tienda activa seleccionada")
      return
    }

    setIsLoading(true)
    try {
      // Filtrar solo los días activos con slots
      const activeDays = data.days.filter(day => day.active)

      const scheduleData = {
        storeId: activeStoreId,
        userId: data.userId,
        validFrom: data.validFrom,
        validUntil: data.validUntil || null,
        days: activeDays
      }

      await axios.post(API_ENDPOINTS.SCHEDULES.CREATE, scheduleData)

      toast.success("Horario creado exitosamente")
      reset()
      setOpen(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error al crear horario:", error)
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Error al crear el horario")
      } else {
        toast.error("Error al crear el horario")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const addSlotToDay = (dayIndex: number) => {
    const currentDay = daysValue[dayIndex]
    const newSlots = [...(currentDay.slots || []), { startTime: "", endTime: "", label: "" }]

    // Actualizar el día con los nuevos slots
    const updatedDays = [...daysValue]
    updatedDays[dayIndex] = { ...currentDay, slots: newSlots }
    reset({ ...watch(), days: updatedDays })
  }

  const removeSlotFromDay = (dayIndex: number, slotIndex: number) => {
    const currentDay = daysValue[dayIndex]
    const newSlots = (currentDay.slots || []).filter((_, i) => i !== slotIndex)

    const updatedDays = [...daysValue]
    updatedDays[dayIndex] = { ...currentDay, slots: newSlots }
    reset({ ...watch(), days: updatedDays })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Crear Nuevo Horario</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Horario</DialogTitle>
          <DialogDescription>
            Define un horario de trabajo para un usuario específico
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Usuario */}
          <div className="space-y-2">
            <Label htmlFor="userId">Usuario *</Label>
            <select
              id="userId"
              {...register("userId")}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isLoadingUsers}
            >
              <option value="">Seleccionar usuario</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.profile.names} {user.profile.lastNames} (@{user.username})
                </option>
              ))}
            </select>
            {errors.userId && (
              <p className="text-sm text-red-500">{errors.userId.message}</p>
            )}
          </div>

          {/* Fechas de validez */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Válido desde *</Label>
              <Input
                id="validFrom"
                type="date"
                {...register("validFrom")}
              />
              {errors.validFrom && (
                <p className="text-sm text-red-500">{errors.validFrom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Válido hasta</Label>
              <Input
                id="validUntil"
                type="date"
                {...register("validUntil")}
              />
            </div>
          </div>

          {/* Días de la semana */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Días de la Semana</Label>

            {dayFields.map((field, dayIndex) => {
              const day = DAYS_OF_WEEK[dayIndex]
              const isActive = daysValue[dayIndex]?.active

              return (
                <div key={field.id} className="border rounded-md p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${dayIndex}-active`}
                      checked={isActive}
                      onCheckedChange={(checked) => {
                        const updatedDays = [...daysValue]
                        updatedDays[dayIndex] = {
                          ...updatedDays[dayIndex],
                          active: !!checked
                        }
                        reset({ ...watch(), days: updatedDays })
                      }}
                    />
                    <Label htmlFor={`day-${dayIndex}-active`} className="font-medium">
                      {day.label}
                    </Label>
                  </div>

                  {isActive && (
                    <div className="ml-6 space-y-3">
                      {daysValue[dayIndex]?.slots?.map((slot, slotIndex) => (
                        <div key={slotIndex} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-3">
                            <Label className="text-xs">Hora inicio</Label>
                            <Input
                              type="time"
                              {...register(`days.${dayIndex}.slots.${slotIndex}.startTime`)}
                              placeholder="HH:MM"
                            />
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs">Hora fin</Label>
                            <Input
                              type="time"
                              {...register(`days.${dayIndex}.slots.${slotIndex}.endTime`)}
                              placeholder="HH:MM"
                            />
                          </div>
                          <div className="col-span-5">
                            <Label className="text-xs">Etiqueta (opcional)</Label>
                            <Input
                              type="text"
                              {...register(`days.${dayIndex}.slots.${slotIndex}.label`)}
                              placeholder="Ej: Turno mañana"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeSlotFromDay(dayIndex, slotIndex)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSlotToDay(dayIndex)}
                      >
                        + Agregar horario
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Horario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewScheduleModal