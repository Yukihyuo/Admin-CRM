import mongoose from "mongoose";
import { ref } from "pdfkit";

const categorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  brandId: { type: String, required: true, ref: 'Brand', index: true },
  name: { type: String, required: true }, // "Snacks y Dulces"

  // VÍNCULO AL SAT
  // Aquí solo guardas el ID de la clave oficial que importaste
  satClaveProdService: { type: String, ref: 'Sat_Catalog' },
  satClaveUnidad: { type: String, default: 'H87' },
  taxRate: { type: Number, default: 0.16 }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;