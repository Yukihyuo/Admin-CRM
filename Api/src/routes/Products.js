import express from 'express'
import {
  createProductMasterWithOptionalBranch,
  createProductBranch,
  getProductMastersByBrand,
  getProductMasterById,
  getProductBranchesByStore,
  getProductBranchById,
  ServiceError
} from '../services/Products.services.js'

const router = express.Router()

const handleRouteError = (error, res, routeName) => {
  console.error(`Error en ${routeName}:`, error)

  if (error instanceof ServiceError) {
    return res.status(error.status).json({
      message: error.message,
      details: error.details
    })
  }

  return res.status(500).json({
    message: 'Error interno al procesar productos',
    error: error.message
  })
}

// Create - Crear un ProductMaster y opcionalmente un ProductBranch
router.post('/master/create', async (req, res) => {
  try {
    const result = await createProductMasterWithOptionalBranch(req.body)

    return res.status(201).json({
      message: result.branchCreated
        ? 'ProductMaster y ProductBranch creados exitosamente'
        : 'ProductMaster creado exitosamente',
      productMaster: result.productMaster,
      productBranch: result.productBranch,
      branchCreated: result.branchCreated
    })
  } catch (error) {
    return handleRouteError(error, res, 'master/create')
  }
})

// Create - Crear un ProductBranch para un ProductMaster existente
router.post('/branch/create', async (req, res) => {
  try {
    const productBranch = await createProductBranch(req.body)

    return res.status(201).json({
      message: 'ProductBranch creado exitosamente',
      productBranch
    })
  } catch (error) {
    return handleRouteError(error, res, 'branch/create')
  }
})

// GetAll - Obtener ProductMaster por marca
router.get('/master/:brandId/getAll', async (req, res) => {
  try {
    const { brandId } = req.params
    const products = await getProductMastersByBrand(brandId)

    return res.status(200).json({
      message: 'ProductMaster obtenidos exitosamente',
      count: products.length,
      products
    })
  } catch (error) {
    return handleRouteError(error, res, 'master/getAll')
  }
})

// GetById - Obtener un ProductMaster por ID
router.get('/master/getById/:id', async (req, res) => {
  try {
    const { id } = req.params
    const productMaster = await getProductMasterById(id)

    return res.status(200).json({
      message: 'ProductMaster obtenido exitosamente',
      productMaster
    })
  } catch (error) {
    return handleRouteError(error, res, 'master/getById')
  }
})

// GetAll - Obtener ProductBranch por sucursal
router.get('/branch/:storeId/getAll', async (req, res) => {
  try {
    const { storeId } = req.params
    const products = await getProductBranchesByStore(storeId)

    return res.status(200).json({
      message: 'ProductBranch obtenidos exitosamente',
      count: products.length,
      products
    })
  } catch (error) {
    return handleRouteError(error, res, 'branch/getAll')
  }
})

// GetById - Obtener un ProductBranch por ID
router.get('/branch/getById/:id', async (req, res) => {
  try {
    const { id } = req.params
    const productBranch = await getProductBranchById(id)

    return res.status(200).json({
      message: 'ProductBranch obtenido exitosamente',
      productBranch
    })
  } catch (error) {
    return handleRouteError(error, res, 'branch/getById')
  }
})

export const routeConfig = { path: '/v1/products', router }
