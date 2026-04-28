import mongoose from 'mongoose';

const productMasterSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  brandId: { // ID del dueño del negocio / empresa global
    type: String, 
    required: true,
    ref: 'Brand',
    index: true 
  },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  sku: { type: String, trim: true }, // Código de barras universal
  brand: { type: String, trim: true },
  imageUrl: { type: String },
  
  // DATOS FISCALES (Se llenan una vez y heredan a todas las sucursales)
  fiscalData: {
    satClaveProdServ: { type: String, default: '01010101' },
    satClaveUnidad: { type: String, default: 'H87' },
    defaultTaxRate: { type: Number, default: 0.16 }
  },

  category: { type: String },
  isArchived: { type: Boolean, default: false } // Para "borrado" lógico global
}, { timestamps: true });

// Búsqueda rápida por SKU o Nombre en todo el catálogo del negocio
productMasterSchema.index({ businessId: 1, sku: 1 }, { unique: true });
productMasterSchema.index({ name: 'text' });

const ProductMaster = mongoose.model('ProductMaster', productMasterSchema);
export default ProductMaster;