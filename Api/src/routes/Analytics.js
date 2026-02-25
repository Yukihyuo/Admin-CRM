import express from "express"
import Sale from "../models/Sale.js"
import Product from "../models/Product.js"
import Subscription from "../models/Subscription.js"
import SubscriptionAssignment from "../models/SubscriptionAssignment.js"
import User from "../models/Staff.js"

const router = express.Router()

// Obtener productos más vendidos
router.get("/products/top-selling", async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query

    // Construcción del filtro de fecha
    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate)
    }

    // Agregación para obtener productos más vendidos
    const topProducts = await Sale.aggregate([
      { $match: { status: "completed", ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ])

    res.json(topProducts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Obtener subscripciones más adquiridas
router.get("/subscriptions/most-acquired", async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Construcción del filtro de fecha
    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate)
    }

    // Agregación para obtener subscripciones más adquiridas
    const topSubscriptions = await SubscriptionAssignment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$subscriptionId",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "_id",
          as: "subscription"
        }
      },
      { $unwind: "$subscription" },
      {
        $project: {
          _id: 1,
          name: "$subscription.name",
          durationInMonths: "$subscription.durationInMonths",
          totalAcquisitions: "$count"
        }
      },
      { $sort: { totalAcquisitions: -1 } }
    ])

    res.json(topSubscriptions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Obtener ingresos por período (día, semana, mes)
router.get("/revenue/by-period", async (req, res) => {
  try {
    const { period = "month", year, month } = req.query

    let groupBy = {}
    let dateFilter = { status: "completed" }

    // Agregar filtro de año/mes si se proporciona
    if (year) {
      const startDate = month 
        ? new Date(year, month - 1, 1)
        : new Date(year, 0, 1)
      const endDate = month
        ? new Date(year, month, 0, 23, 59, 59)
        : new Date(year, 11, 31, 23, 59, 59)
      
      dateFilter.createdAt = { $gte: startDate, $lte: endDate }
    }

    // Definir agrupación según período
    switch (period) {
      case "day":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        }
        break
      case "week":
        groupBy = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" }
        }
        break
      case "month":
      default:
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        }
        break
    }

    const revenue = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: "$totals.total" },
          totalSales: { $count: {} },
          averageTicket: { $avg: "$totals.total" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
    ])

    res.json(revenue)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Obtener estadísticas generales del dashboard
router.get("/dashboard/summary", async (req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Ventas del mes actual
    const currentMonthSales = await Sale.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totals.total" },
          totalSales: { $count: {} }
        }
      }
    ])

    // Ventas del mes anterior
    const lastMonthSales = await Sale.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totals.total" },
          totalSales: { $count: {} }
        }
      }
    ])

    // Subscripciones activas
    const activeSubscriptions = await SubscriptionAssignment.countDocuments({
      endDate: { $gte: now }
    })

    // Subscripciones del mes
    const monthSubscriptions = await SubscriptionAssignment.countDocuments({
      createdAt: { $gte: startOfMonth }
    })

    // Productos con bajo stock
    const lowStockProducts = await Product.countDocuments({
      stock: { $lt: 10 },
      status: "available"
    })

    // Total de clientes (usuarios con rol de cliente)
    const totalClients = await User.countDocuments({})

    // Calcular cambios porcentuales
    const currentRevenue = currentMonthSales[0]?.totalRevenue || 0
    const lastRevenue = lastMonthSales[0]?.totalRevenue || 0
    const revenueChange = lastRevenue > 0 
      ? ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(2)
      : 0

    const currentSales = currentMonthSales[0]?.totalSales || 0
    const lastSales = lastMonthSales[0]?.totalSales || 0
    const salesChange = lastSales > 0
      ? ((currentSales - lastSales) / lastSales * 100).toFixed(2)
      : 0

    res.json({
      currentMonth: {
        revenue: currentRevenue,
        sales: currentSales,
        revenueChange: parseFloat(revenueChange),
        salesChange: parseFloat(salesChange)
      },
      subscriptions: {
        active: activeSubscriptions,
        newThisMonth: monthSubscriptions
      },
      inventory: {
        lowStockCount: lowStockProducts
      },
      clients: {
        total: totalClients
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Obtener ventas por método de pago
router.get("/sales/by-payment-method", async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const dateFilter = { status: "completed" }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate)
    }

    const salesByPayment = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$payment.method",
          totalSales: { $count: {} },
          totalRevenue: { $sum: "$totals.total" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])

    res.json(salesByPayment)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Obtener ingresos por categoría de producto
router.get("/revenue/by-category", async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const dateFilter = { status: "completed" }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate)
    }

    const revenueByCategory = await Sale.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalRevenue: { $sum: "$items.subtotal" },
          totalQuantity: { $sum: "$items.quantity" },
          salesCount: { $count: {} }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])

    res.json(revenueByCategory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Obtener top clientes (por compras)
router.get("/clients/top-buyers", async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const topClients = await Sale.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$clientId",
          totalPurchases: { $count: {} },
          totalSpent: { $sum: "$totals.total" },
          averageTicket: { $avg: "$totals.total" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: "$client" },
      {
        $project: {
          _id: 1,
          clientName: "$client.name",
          clientEmail: "$client.email",
          totalPurchases: 1,
          totalSpent: 1,
          averageTicket: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ])

    res.json(topClients)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Obtener subscripciones próximas a vencer
router.get("/subscriptions/expiring-soon", async (req, res) => {
  try {
    const { days = 7 } = req.query
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + parseInt(days))

    const expiringSoon = await SubscriptionAssignment.aggregate([
      {
        $match: {
          endDate: {
            $gte: now,
            $lte: futureDate
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "subscriptions",
          localField: "subscriptionId",
          foreignField: "_id",
          as: "subscription"
        }
      },
      { $unwind: "$subscription" },
      {
        $project: {
          _id: 1,
          userName: "$user.name",
          userEmail: "$user.email",
          subscriptionName: "$subscription.name",
          endDate: 1,
          daysRemaining: {
            $divide: [
              { $subtract: ["$endDate", now] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      { $sort: { endDate: 1 } }
    ])

    res.json(expiringSoon)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
