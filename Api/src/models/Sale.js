import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  brandId: { type: String, ref: 'Brand', required: true }, // Importante para reportes globales
  storeId: { type: String, ref: 'Store', required: true },
  staffId: { type: String, ref: 'Staff', required: true },
  clientId: { type: String, ref: 'Client', default: null },
  receiptNumber: { type: String, unique: true, required: true },

  // --- EL CARRITO MIXTO ---
  items: [{
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    
    // Referencia polimórfica (puede ser Producto o Servicio de membresía)
    relatedId: { type: String, required: true }, 
    itemType: { type: String, enum: ['product', 'service'], required: true },
    
    name: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },

    // DATA FISCAL CONGELADA (Para que no cambie si el catálogo se edita)
    fiscalData: {
      satClaveProdServ: { type: String, required: true },
      satClaveUnidad: { type: String, required: true },
      taxRate: { type: Number, default: 0.16 },
      isTaxable: { type: Boolean, default: true }
    }
  }],

  // --- CARGOS EXTRA (Campos variables que discutimos) ---
  extraCharges: [{
    extraChargeId: { type: String, ref: 'ExtraCharge' },
    name: String,
    amount: { type: Number, required: true },
    fiscalData: {
      satClaveProdServ: String,
      satClaveUnidad: String,
      taxRate: Number
    }
  }],

  // --- TOTALES FINALES ---
  totals: {
    itemsSubtotal: { type: Number, required: true }, // Suma de items
    extraChargesTotal: { type: Number, default: 0 }, // Suma de cargos
    discount: { type: Number, default: 0 },
    taxTotal: { type: Number, required: true },      // IVA calculado de todo
    grandTotal: { type: Number, required: true }     // El monto final cobrado
  },

  payment: {
    method: { type: String, enum: ['cash', 'card', 'transfer', 'multiple'], required: true },
    // Soporte para pagos mixtos (opcional pero recomendado)
    splitDetails: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      transfer: { type: Number, default: 0 }
    },
    amountPaid: Number,
    change: Number
  },

  status: { type: String, enum: ['completed', 'cancelled', 'refunded'], default: 'completed' },
  isInvoiced: { type: Boolean, default: false }, // Para saber si ya se generó el CFDI
  invoiceId: { type: String, default: null }    // Link al documento de factura
}, { timestamps: true });

saleSchema.index({ storeId: 1, createdAt: -1 });

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;