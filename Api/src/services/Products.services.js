import ProductMaster from '../models/ProductMaster.js'
import ProductBranch from '../models/ProductBranch.js'
import Store from '../models/Store.js'
import SatCatalog from '../models/SatCatalog.js'
import SatUnitCatalog from '../models/SatUnitCatalog.js'

class ServiceError extends Error {
	constructor(message, status = 400, details = null) {
		super(message)
		this.name = 'ServiceError'
		this.status = status
		this.details = details
	}
}

const isDefined = (value) => value !== undefined && value !== null

const validateStoreExists = async (storeId) => {
	if (!storeId) {
		throw new ServiceError('storeId es requerido', 400)
	}

	const store = await Store.findById(storeId).lean()
	if (!store) {
		throw new ServiceError('Tienda no encontrada', 404)
	}

	return store
}

const validateFiscalData = async (fiscalData = {}) => {
	if (!fiscalData || typeof fiscalData !== 'object') {
		return
	}

	const { satKey, satUnitKey, defaultTaxRate } = fiscalData

	if (isDefined(defaultTaxRate) && (defaultTaxRate < 0 || defaultTaxRate > 1)) {
		throw new ServiceError('defaultTaxRate debe estar entre 0 y 1', 400)
	}

	if (isDefined(satKey)) {
		const satExists = await SatCatalog.exists({ _id: satKey })
		if (!satExists) {
			throw new ServiceError('satKey no existe en catálogo SAT', 400)
		}
	}

	if (isDefined(satUnitKey)) {
		const satUnitExists = await SatUnitCatalog.exists({ _id: satUnitKey })
		if (!satUnitExists) {
			throw new ServiceError('satUnitKey no existe en catálogo SAT de unidades', 400)
		}
	}
}

const normalizeBranchData = (payload = {}) => {
	if (payload.branch && typeof payload.branch === 'object') {
		return payload.branch
	}

	if (payload.productBranch && typeof payload.productBranch === 'object') {
		return payload.productBranch
	}

	return {
		storeId: payload.storeId,
		price: payload.price,
		costPrice: payload.costPrice,
		stock: payload.stock,
		lowStockAlert: payload.lowStockAlert,
		status: payload.status
	}
}

const hasEnoughDataForBranch = (branchData = {}) => {
	return !!branchData.storeId && isDefined(branchData.price)
}

export const createProductMaster = async (payload = {}) => {
	const { brandId, name, description, sku, brand, imageUrl, fiscalData, category, isArchived } = payload

	if (!brandId || !name) {
		throw new ServiceError('brandId y name son requeridos para crear ProductMaster', 400)
	}

	await validateFiscalData(fiscalData)

	try {
		const productMaster = await ProductMaster.create({
			brandId,
			name,
			description,
			sku,
			brand,
			imageUrl,
			fiscalData,
			category,
			isArchived
		})

		return productMaster
	} catch (error) {
		if (error?.code === 11000) {
			throw new ServiceError('Ya existe un ProductMaster con ese SKU para la marca', 409)
		}

		throw error
	}
}

export const createProductBranch = async (payload = {}) => {
	const { masterProductId, storeId, price, costPrice, stock, lowStockAlert, status } = payload

	if (!masterProductId || !storeId || !isDefined(price)) {
		throw new ServiceError('masterProductId, storeId y price son requeridos para crear ProductBranch', 400)
	}

	if (price < 0) {
		throw new ServiceError('price no puede ser negativo', 400)
	}

	if (isDefined(costPrice) && costPrice < 0) {
		throw new ServiceError('costPrice no puede ser negativo', 400)
	}

	if (isDefined(stock) && stock < 0) {
		throw new ServiceError('stock no puede ser negativo', 400)
	}

	if (isDefined(lowStockAlert) && lowStockAlert < 0) {
		throw new ServiceError('lowStockAlert no puede ser negativo', 400)
	}

	const masterExists = await ProductMaster.exists({ _id: masterProductId })
	if (!masterExists) {
		throw new ServiceError('ProductMaster no encontrado', 404)
	}

	await validateStoreExists(storeId)

	try {
		const productBranch = await ProductBranch.create({
			masterProductId,
			storeId,
			price,
			costPrice,
			stock,
			lowStockAlert,
			status
		})

		return productBranch
	} catch (error) {
		if (error?.code === 11000) {
			throw new ServiceError('Esta sucursal ya tiene registrado este ProductMaster', 409)
		}

		throw error
	}
}

export const createProductMasterWithOptionalBranch = async (payload = {}) => {
	const productMaster = await createProductMaster(payload)
	const branchPayload = normalizeBranchData(payload)

	if (!hasEnoughDataForBranch(branchPayload)) {
		return {
			productMaster,
			productBranch: null,
			branchCreated: false
		}
	}

	const productBranch = await createProductBranch({
		...branchPayload,
		masterProductId: productMaster._id
	})

	return {
		productMaster,
		productBranch,
		branchCreated: true
	}
}

export const getProductMastersByBrand = async (brandId) => {
	if (!brandId) {
		throw new ServiceError('brandId es requerido', 400)
	}

	return ProductMaster.find({ brandId, isArchived: false }).sort({ createdAt: -1 }).lean()
}

export const getProductMasterById = async (id) => {
	if (!id) {
		throw new ServiceError('id es requerido', 400)
	}

	const productMaster = await ProductMaster.findById(id).lean()
	if (!productMaster) {
		throw new ServiceError('ProductMaster no encontrado', 404)
	}

	return productMaster
}

export const getProductBranchesByStore = async (storeId) => {
	await validateStoreExists(storeId)

	return ProductBranch.find({ storeId })
		.sort({ createdAt: -1 })
		.populate('masterProductId')
		.lean()
}

export const getProductBranchById = async (id) => {
	if (!id) {
		throw new ServiceError('id es requerido', 400)
	}

	const productBranch = await ProductBranch.findById(id).populate('masterProductId').lean()
	if (!productBranch) {
		throw new ServiceError('ProductBranch no encontrado', 404)
	}

	return productBranch
}

export { ServiceError }
