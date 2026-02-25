import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import axios, { type AxiosError } from "axios";
import { toast } from "react-toastify";
import { Eye, Pencil, X } from "lucide-react";

import { API_ENDPOINTS } from "@/config/api"
import { useAuthStore } from "@/store/authStore"

type StoreFormData = {
  name: string;
  code: string;
  description: string;
  email: string;
  phone: string;
  isActive: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
};

interface DetailsStoreProps {
  storeId: string;
  onStoreUpdated?: () => void;
}

export default function DetailsStoreModal({ storeId, onStoreUpdated }: DetailsStoreProps) {
  const { token } = useAuthStore();
  
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<StoreFormData>({
    defaultValues: {
      name: "",
      code: "",
      description: "",
      email: "",
      phone: "",
      isActive: true,
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
    },
  });

  const isActive = watch("isActive");

  const loadStoreData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.STORES.GET_BY_ID(storeId), {
        headers: {
          Authorization: token
        }
      });

      const storeData = response.data.store;
      reset({
        name: storeData.name || "",
        code: storeData.code || "",
        description: storeData.description || "",
        email: storeData.email || "",
        phone: storeData.phone || "",
        isActive: storeData.isActive ?? true,
        address: {
          street: storeData.address?.street || "",
          city: storeData.address?.city || "",
          state: storeData.address?.state || "",
          zipCode: storeData.address?.zipCode || "",
          country: storeData.address?.country || "",
        },
      });

    } catch (error) {
      console.error("Error al cargar tienda:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || "Error al cargar tienda");
    } finally {
      setIsLoading(false);
    }
  }, [storeId, token, reset]);

  // Load store data when modal opens
  useEffect(() => {
    if (open && storeId) {
      loadStoreData();
      setIsEditing(false);
    }
  }, [open, storeId, loadStoreData]);

  const onSubmit = async (data: StoreFormData) => {
    if (!data.name.trim()) {
      toast.error("El nombre de la tienda es requerido");
      return;
    }

    try {
      const payload = {
        name: data.name.trim(),
        code: data.code?.trim() || undefined,
        description: data.description?.trim() || undefined,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        address: data.address ? {
          street: data.address.street?.trim() || undefined,
          city: data.address.city?.trim() || undefined,
          state: data.address.state?.trim() || undefined,
          zipCode: data.address.zipCode?.trim() || undefined,
          country: data.address.country?.trim() || undefined,
        } : undefined,
        isActive: data.isActive
      };

      const response = await axios.put(API_ENDPOINTS.STORES.UPDATE(storeId), payload, {
        headers: {
          Authorization: token
        }
      });

      toast.success(response.data.message || "Tienda actualizada exitosamente");
      
      if (onStoreUpdated) {
        onStoreUpdated();
      }
      
      setIsEditing(false);
      
    } catch (error) {
      console.error("Error al actualizar tienda:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || "Error al actualizar tienda";
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      setIsEditing(false);
      loadStoreData();
    } else {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver detalles
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isEditing ? "Editar Tienda" : "Detalles de Tienda"}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? "Actualiza la información de la tienda" 
                  : "Visualiza la información de la tienda"}
              </DialogDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando detalles...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              {/* Información Básica */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Tienda *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Gimnasio Centro"
                  {...register("name", { required: "El nombre es requerido" })}
                  readOnly={!isEditing}
                  disabled={isSubmitting}
                  className={`${errors.name ? "border-red-500" : ""} ${!isEditing ? "bg-muted cursor-default" : ""}`}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    placeholder="Ej: GC-001"
                    {...register("code")}
                    readOnly={!isEditing}
                    disabled={isSubmitting}
                    className={!isEditing ? "bg-muted cursor-default" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tienda@example.com"
                    {...register("email", {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email inválido"
                      }
                    })}
                    readOnly={!isEditing}
                    disabled={isSubmitting}
                    className={`${errors.email ? "border-red-500" : ""} ${!isEditing ? "bg-muted cursor-default" : ""}`}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="Ej: +1234567890"
                  {...register("phone")}
                  readOnly={!isEditing}
                  disabled={isSubmitting}
                  className={!isEditing ? "bg-muted cursor-default" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Descripción de la tienda"
                  {...register("description")}
                  readOnly={!isEditing}
                  disabled={isSubmitting}
                  className={!isEditing ? "bg-muted cursor-default" : ""}
                />
              </div>

              {/* Dirección */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Dirección</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="street">Calle</Label>
                  <Input
                    id="street"
                    placeholder="Ej: Calle Principal 123"
                    {...register("address.street")}
                    readOnly={!isEditing}
                    disabled={isSubmitting}
                    className={!isEditing ? "bg-muted cursor-default" : ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Ej: Madrid"
                      {...register("address.city")}
                      readOnly={!isEditing}
                      disabled={isSubmitting}
                      className={!isEditing ? "bg-muted cursor-default" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado/Provincia</Label>
                    <Input
                      id="state"
                      placeholder="Ej: Madrid"
                      {...register("address.state")}
                      readOnly={!isEditing}
                      disabled={isSubmitting}
                      className={!isEditing ? "bg-muted cursor-default" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Código Postal</Label>
                    <Input
                      id="zipCode"
                      placeholder="Ej: 28001"
                      {...register("address.zipCode")}
                      readOnly={!isEditing}
                      disabled={isSubmitting}
                      className={!isEditing ? "bg-muted cursor-default" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      placeholder="Ej: España"
                      {...register("address.country")}
                      readOnly={!isEditing}
                      disabled={isSubmitting}
                      className={!isEditing ? "bg-muted cursor-default" : ""}
                    />
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={() => {}}
                  disabled={!isEditing || isSubmitting}
                  {...register("isActive")}
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                  Tienda activa
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isLoading}
              >
                {isEditing ? <X className="h-4 w-4 mr-1" /> : null}
                {isEditing ? "Cancelar" : "Cerrar"}
              </Button>

              {isEditing && (
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
