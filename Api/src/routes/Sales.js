import express from 'express';

import ProductBranch from '../models/ProductBranch.js';
import ServiceBranch from '../models/ServiceBranch.js';
import ExtraCharge from '../models/ExtraCharge.js';
import Sale from '../models/Sale.js';
import Staff from '../models/Staff.js';
import Store from '../models/Store.js';
import Client from '../models/Client.js';

const router = express.Router();

const validateStoreExists = async (storeId) => {
  if (!storeId) return null;
  return Store.findById(storeId);
};

const toSafeNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeItemFiscalData = (fiscalData = {}) => {
  return {
    satClaveProdServ: fiscalData?.satKey || fiscalData?.satClaveProdServ || '01010101',
    satClaveUnidad: fiscalData?.satUnitKey || fiscalData?.satClaveUnidad || 'H87',
    taxRate: toSafeNumber(fiscalData?.defaultTaxRate ?? fiscalData?.taxRate, 0.16),
    isTaxable: fiscalData?.isTaxable !== false
  };
};

const normalizeExtraFiscalData = (fiscalData = {}) => {
  return {
    satClaveProdServ: fiscalData?.satClaveProdServ || '01010101',
    satClaveUnidad: fiscalData?.satClaveUnidad || 'E48',
    taxRate: toSafeNumber(fiscalData?.taxRate, 0.16)
  };
};

// Generar número de recibo único
const generateReceiptNumber = async () => {
  const lastSale = await Sale.findOne().sort({ createdAt: -1 });
  const lastNumber = lastSale ? parseInt(lastSale.receiptNumber.split('-')[1]) : 0;
  const newNumber = (lastNumber + 1).toString().padStart(6, '0');
  return `REC-${newNumber}`;
};

// POST - Crear una nueva venta
router.post('/create', async (req, res) => {
  try {
    const { storeId, clientId, items, payment, staffId, extraCharges = [], totals = {} } = req.body;

    // Validar que existan los datos requeridos
    if (!storeId || !items || !items.length || !payment || !staffId) {
      return res.status(400).json({
        message: 'Faltan datos requeridos: storeId, items, payment, staffId'
      });
    }

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    // Validar que el usuario vendedor exista
    const seller = await Staff.findById(staffId);

    if (!seller) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    if (clientId) {
      const client = await Client.findById(clientId);

      if (!client) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }

      if (client.brandId !== store.brandId) {
        return res.status(400).json({ message: 'El cliente no pertenece a la marca de la tienda activa' });
      }
    }

    const stockUpdates = [];
    const saleItems = [];

    // Validar items del carrito mixto y congelar precio/fiscalData
    for (const item of items) {
      if (!item.relatedId || !item.itemType || !['product', 'service'].includes(item.itemType)) {
        return res.status(400).json({
          message: 'Cada item debe incluir relatedId y itemType (product o service)'
        });
      }

      const quantity = toSafeNumber(item.quantity, 1);
      if (quantity < 1) {
        return res.status(400).json({
          message: 'La cantidad de cada item debe ser mayor a 0'
        });
      }

      if (item.itemType === 'product') {
        const productBranch = await ProductBranch.findOne({ _id: item.relatedId, storeId }).populate('masterProductId');

        if (!productBranch) {
          return res.status(404).json({
            message: `Producto de sucursal ${item.relatedId} no encontrado en la tienda`
          });
        }

        if (productBranch.status !== 'active') {
          return res.status(400).json({
            message: `El producto ${productBranch.masterProductId?.name || productBranch._id} no está activo`
          });
        }

        if (productBranch.stock < quantity) {
          return res.status(400).json({
            message: `Stock insuficiente para ${productBranch.masterProductId?.name || productBranch._id}. Disponible: ${productBranch.stock}, Solicitado: ${quantity}`
          });
        }

        const fiscalData = normalizeItemFiscalData(productBranch.masterProductId?.fiscalData);
        const price = toSafeNumber(item.price, productBranch.price);
        const subtotal = price * quantity;

        saleItems.push({
          relatedId: productBranch._id,
          itemType: 'product',
          name: productBranch.masterProductId?.name || item.name,
          price,
          quantity,
          subtotal,
          fiscalData
        });

        stockUpdates.push({ branch: productBranch, quantity });
        continue;
      }

      const serviceBranch = await ServiceBranch.findOne({ _id: item.relatedId, storeId }).populate('masterServiceId');

      if (!serviceBranch) {
        return res.status(404).json({
          message: `Servicio de sucursal ${item.relatedId} no encontrado en la tienda`
        });
      }

      if (serviceBranch.status !== 'active') {
        return res.status(400).json({
          message: `El servicio ${serviceBranch.masterServiceId?.name || serviceBranch._id} no está activo`
        });
      }

      const fiscalData = normalizeItemFiscalData(serviceBranch.masterServiceId?.fiscalData);
      const price = toSafeNumber(item.price, serviceBranch.price);
      const subtotal = price * quantity;

      saleItems.push({
        relatedId: serviceBranch._id,
        itemType: 'service',
        name: serviceBranch.masterServiceId?.name || item.name,
        price,
        quantity,
        subtotal,
        fiscalData
      });
    }

    // Normalizar cargos extra y congelar su data fiscal
    const normalizedExtraCharges = [];
    for (const extra of extraCharges) {
      const amount = toSafeNumber(extra?.amount, 0);
      if (amount <= 0) {
        return res.status(400).json({ message: 'Cada cargo extra debe tener amount mayor a 0' });
      }

      if (extra?.extraChargeId) {
        const extraChargeConfig = await ExtraCharge.findById(extra.extraChargeId);
        if (!extraChargeConfig) {
          return res.status(404).json({ message: `Cargo extra ${extra.extraChargeId} no encontrado` });
        }

        if (extraChargeConfig.businessId !== store.brandId) {
          return res.status(400).json({ message: `El cargo extra ${extraChargeConfig.name} no pertenece a la marca de la tienda activa` });
        }

        if (!extraChargeConfig.isActive) {
          return res.status(400).json({ message: `El cargo extra ${extraChargeConfig.name} está inactivo` });
        }

        normalizedExtraCharges.push({
          extraChargeId: extraChargeConfig._id,
          name: extraChargeConfig.name,
          amount,
          fiscalData: normalizeExtraFiscalData(extraChargeConfig.fiscalData)
        });
        continue;
      }

      if (!extra?.name) {
        return res.status(400).json({
          message: 'Si un cargo extra no incluye extraChargeId, debe incluir name'
        });
      }

      normalizedExtraCharges.push({
        name: extra.name,
        amount,
        fiscalData: normalizeExtraFiscalData(extra.fiscalData)
      });
    }

    // Calcular totales con el nuevo esquema
    const itemsSubtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const extraChargesTotal = normalizedExtraCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const itemsTaxTotal = saleItems.reduce((sum, item) => {
      const lineTax = item.fiscalData.isTaxable ? item.subtotal * toSafeNumber(item.fiscalData.taxRate, 0) : 0;
      return sum + lineTax;
    }, 0);
    const extraTaxTotal = normalizedExtraCharges.reduce((sum, charge) => {
      return sum + (charge.amount * toSafeNumber(charge.fiscalData?.taxRate, 0));
    }, 0);
    const taxTotal = itemsTaxTotal + extraTaxTotal;
    const discount = toSafeNumber(totals?.discount, 0);
    const grandTotal = itemsSubtotal + extraChargesTotal + taxTotal - discount;

    if (grandTotal < 0) {
      return res.status(400).json({ message: 'El total de la venta no puede ser negativo' });
    }

    if (!payment?.method || !['cash', 'card', 'transfer', 'multiple'].includes(payment.method)) {
      return res.status(400).json({
        message: 'Método de pago inválido. Debe ser cash, card, transfer o multiple'
      });
    }

    // Validar pago para método efectivo
    if (payment.method === 'cash') {
      const amountPaid = toSafeNumber(payment.amountPaid, 0);
      if (amountPaid < grandTotal) {
        return res.status(400).json({
          message: `Monto insuficiente. Total: $${grandTotal}, Pagado: $${amountPaid}`
        });
      }
      payment.amountPaid = amountPaid;
      payment.change = amountPaid - grandTotal;
    }

    if (payment.method === 'multiple') {
      const splitDetails = {
        cash: toSafeNumber(payment?.splitDetails?.cash, 0),
        card: toSafeNumber(payment?.splitDetails?.card, 0),
        transfer: toSafeNumber(payment?.splitDetails?.transfer, 0)
      };

      const splitTotal = splitDetails.cash + splitDetails.card + splitDetails.transfer;
      if (splitTotal < grandTotal) {
        return res.status(400).json({
          message: `Pago mixto insuficiente. Total: $${grandTotal}, Capturado: $${splitTotal}`
        });
      }

      payment.splitDetails = splitDetails;
      payment.amountPaid = toSafeNumber(payment.amountPaid, splitTotal);
      payment.change = payment.amountPaid > grandTotal ? payment.amountPaid - grandTotal : 0;
    }

    // Generar número de recibo
    const receiptNumber = await generateReceiptNumber();

    // Crear la venta
    const sale = new Sale({
      brandId: store.brandId,
      storeId: storeId,
      staffId,
      clientId: clientId || null,
      receiptNumber,
      items: saleItems,
      extraCharges: normalizedExtraCharges,
      totals: {
        itemsSubtotal,
        extraChargesTotal,
        discount,
        taxTotal,
        grandTotal
      },
      payment,
      status: 'completed'
    });

    await sale.save();

    // Reducir el stock de productos de sucursal
    for (const { branch, quantity } of stockUpdates) {
      branch.stock -= quantity;
      await branch.save();
    }

    // Poblar la información del cliente y vendedor para la respuesta
    await sale.populate([
      { path: 'clientId', select: 'profile.names profile.lastNames email' },
      { path: 'staffId', select: 'profile.names profile.lastNames email' },
      { path: 'extraCharges.extraChargeId', select: 'name' }
    ]);

    res.status(201).json({
      message: 'Venta creada exitosamente',
      sale
    });

  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({
      message: 'Error al crear la venta',
      error: error.message
    });
  }
});

// GET - Obtener todas las ventas
router.get('/:storeId/getAll', async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const sales = await Sale.find({ storeId })
      .populate('clientId', 'profile')
      .populate('staffId', 'profile')
      .sort({ createdAt: -1 });

    res.status(200).json({ sales });

  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      message: 'Error al obtener las ventas',
      error: error.message
    });
  }
});

// GET - Obtener una venta específica
router.get('/:storeId/getById/:id', async (req, res) => {
  try {
    const { storeId, id } = req.params;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const sale = await Sale.findOne({ _id: id, storeId })
      .populate('clientId', 'profile.names profile.lastNames email')
      .populate('staffId', 'profile.names profile.lastNames email')
      .populate('extraCharges.extraChargeId', 'name');

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    res.json(sale);

  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      message: 'Error al obtener la venta',
      error: error.message
    });
  }
});

// GET - Estadísticas de ventas
router.get('/:storeId/stats/summary', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, sellerId } = req.query;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    const filters = { status: 'completed', storeId };

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    if (sellerId) filters.staffId = sellerId;

    const stats = await Sale.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totals.grandTotal' },
          totalTax: { $sum: '$totals.taxTotal' },
          totalDiscount: { $sum: '$totals.discount' },
          averageTicket: { $avg: '$totals.grandTotal' }
        }
      }
    ]);

    // Ventas por método de pago
    const paymentMethods = await Sale.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$payment.method',
          count: { $sum: 1 },
          total: { $sum: '$totals.grandTotal' }
        }
      }
    ]);

    // Items más vendidos (productos + servicios)
    const topItems = await Sale.aggregate([
      { $match: filters },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            relatedId: '$items.relatedId',
            itemType: '$items.itemType'
          },
          name: { $first: '$items.name' },
          itemType: { $first: '$items.itemType' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      summary: stats[0] || {
        totalSales: 0,
        totalRevenue: 0,
        totalTax: 0,
        totalDiscount: 0,
        averageTicket: 0
      },
      paymentMethods,
      topItems
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// PATCH - Cancelar/Reembolsar una venta
router.patch('/:storeId/:id/status', async (req, res) => {
  try {
    const { storeId, id } = req.params;
    const { status, reason } = req.body;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Tienda no encontrada' });
    }

    if (!['cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({
        message: 'Estado inválido. Debe ser "cancelled" o "refunded"'
      });
    }

    const sale = await Sale.findOne({ _id: id, storeId });

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    if (sale.status !== 'completed') {
      return res.status(400).json({
        message: 'Solo se pueden cancelar/reembolsar ventas completadas'
      });
    }

    // Si es reembolso, devolver el stock de los items tipo product
    if (status === 'refunded') {
      for (const item of sale.items) {
        if (item.itemType !== 'product') {
          continue;
        }

        const productBranch = await ProductBranch.findOne({ _id: item.relatedId, storeId });
        if (productBranch) {
          productBranch.stock += item.quantity;
          await productBranch.save();
        }
      }
    }

    sale.status = status;
    await sale.save();

    res.json({
      message: `Venta ${status === 'cancelled' ? 'cancelada' : 'reembolsada'} exitosamente${reason ? `. Motivo: ${reason}` : ''}`,
      sale
    });

  } catch (error) {
    console.error('Error al actualizar estado de venta:', error);
    res.status(500).json({
      message: 'Error al actualizar la venta',
      error: error.message
    });
  }
});

export const routeConfig = { path: "/v1/sales", router }