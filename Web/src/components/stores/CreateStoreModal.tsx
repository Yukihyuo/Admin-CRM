import { type FormEvent, useState } from "react";
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
import axios, { type AxiosError } from "axios";
import { toast } from "react-toastify";

import { API_ENDPOINTS } from "@/config/api"
import { useAuthStore } from "@/store/authStore"

type SubmitHandler = (
  event: FormEvent<HTMLFormElement>
) => void | boolean | Promise<void | boolean>;

interface CreateStoreProps {
  onStoreCreated?: () => void;
  onSubmit?: SubmitHandler;
}

export default function CreateStoreModal({ onStoreCreated, onSubmit }: CreateStoreProps) {
  const { token } = useAuthStore()
  const brandId = useAuthStore((state) => state.getBrandId())

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false)

  // Form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  // Address fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");

  const handleCancel = () => {
    setOpen(false);
    // Reset form
    setName("");
    setCode("");
    setDescription("");
    setEmail("");
    setPhone("");
    setIsActive(true);
    setStreet("");
    setCity("");
    setState("");
    setZipCode("");
    setCountry("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!brandId) {
      toast.error("No se pudo obtener el ID de marca");
      return;
    }

    if (!name.trim()) {
      toast.error("El nombre de la tienda es requerido");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        brandId,
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: {
          street: street.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          zipCode: zipCode.trim() || undefined,
          country: country.trim() || undefined
        },
        isActive
      };

      const response = await axios.post(API_ENDPOINTS.STORES.CREATE, payload, {
        headers: {
          Authorization: token
        }
      });

      toast.success(response.data.message || "Tienda creada exitosamente");
      
      // Call parent callback if provided
      if (onStoreCreated) {
        onStoreCreated();
      }
      
      // Call custom onSubmit if provided
      if (onSubmit) {
        await onSubmit(event);
      }
      
      // Close modal and reset form
      handleCancel();
      setOpen(false);
      
    } catch (error) {
      console.error("Error al crear tienda:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || "Error al crear tienda";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Crear Tienda</Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tienda</DialogTitle>
          <DialogDescription>Completa los datos para crear una nueva tienda en tu marca</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Información Básica */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Tienda *</Label>
              <Input
                id="name"
                placeholder="Ej: Gimnasio Centro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  placeholder="Ej: GC-001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tienda@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="Ej: +1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Descripción de la tienda"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
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
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Ej: Madrid"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado/Provincia</Label>
                  <Input
                    id="state"
                    placeholder="Ej: Madrid"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Código Postal</Label>
                  <Input
                    id="zipCode"
                    placeholder="Ej: 28001"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    placeholder="Ej: España"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
                disabled={loading}
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
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear Tienda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
