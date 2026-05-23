import mongoose from 'mongoose';

const cashClosingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  staffId: { type: String, required: true, ref: 'Staff' },
  brandId: { type: String, required: true, ref: 'Brand' },
  storeId: { type: String, required: true, ref: 'Store' },
  
  openingDate: { type: Date, required: true },
  closingDate: { type: Date, default: Date.now },

  // --- FLUJO DE EFECTIVO ---
  initialCash: { type: Number, required: true, default: 0 }, // Fondo de caja
  
  // Totales calculados por el sistema (Query a Sales y Expenses en el backend)
  systemTotals: {
    totalSales: { type: Number, required: true }, // Suma total de ventas (Efectivo + Tarjeta + Transfer)
    totalExpenses: { type: Number, default: 0 },  // Suma de gastos registrados
    expectedCash: { type: Number, required: true } // (initialCash + salesInCash) - totalExpenses
  },

  // --- REPORTE DEL EMPLEADO ---
  reportedTotals: {
    cashInHand: { type: Number, required: true },
    transferAmount: { type: Number, default: 0 },
    cardAmount: { type: Number, default: 0 }
  },

  // Diferencia solo en efectivo (es lo más común que "falta" o "sobra")
  cashDifference: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['balanced', 'shortage', 'surplus', 'pending', 'incomplete'], 
    default: 'balanced' 
  },
  
  // --- LOS ENLACES (Audit Log) ---
  // Guardamos los IDs para "congelar" qué ventas entraron en este cierre.
  salesIds: [{ type: String }], 
  expensesIds: [{ type: String }], 
  
  notes: { type: String }
}, { timestamps: true });

const CashCut = mongoose.model('CashCut', cashClosingSchema);
export default CashCut;