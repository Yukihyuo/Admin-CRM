import ServiceMaster from '../models/ServiceMaster.js'
import ServiceBranch from '../models/ServiceBranch.js'
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

	if (payload.serviceBranch && typeof payload.serviceBranch === 'object') {
		return payload.serviceBranch
	}

	return {
		storeId: payload.storeId,
		price: payload.price,
		estimatedDuration: payload.estimatedDuration,
		status: payload.status
	}
}

const hasEnoughDataForBranch = (branchData = {}) => {
	return !!branchData.storeId && isDefined(branchData.price)
}

export const createServiceMaster = async (payload = {}) => {
	const { businessId, name, description, category, fiscalData, isArchived } = payload

	if (!businessId || !name) {
		throw new ServiceError('businessId y name son requeridos para crear ServiceMaster', 400)
	}

	await validateFiscalData(fiscalData)

	const serviceMaster = await ServiceMaster.create({
		businessId,
		name,
		description,
		category,
		fiscalData,
		isArchived
	})

	return serviceMaster
}

export const createServiceBranch = async (payload = {}) => {
	const { masterServiceId, storeId, price, estimatedDuration, status } = payload

	if (!masterServiceId || !storeId || !isDefined(price)) {
		throw new ServiceError('masterServiceId, storeId y price son requeridos para crear ServiceBranch', 400)
	}

	if (price < 0) {
		throw new ServiceError('price no puede ser negativo', 400)
	}

	if (isDefined(estimatedDuration) && estimatedDuration < 0) {
		throw new ServiceError('estimatedDuration no puede ser negativo', 400)
	}

	const masterExists = await ServiceMaster.exists({ _id: masterServiceId })
	if (!masterExists) {
		throw new ServiceError('ServiceMaster no encontrado', 404)
	}

	await validateStoreExists(storeId)

	try {
		const serviceBranch = await ServiceBranch.create({
			masterServiceId,
			storeId,
			price,
			estimatedDuration,
			status
		})

		return serviceBranch
	} catch (error) {
		if (error?.code === 11000) {
			throw new ServiceError('Esta sucursal ya tiene registrado este ServiceMaster', 409)
		}

		throw error
	}
}

export const createServiceMasterWithOptionalBranch = async (payload = {}) => {
	const serviceMaster = await createServiceMaster(payload)
	const branchPayload = normalizeBranchData(payload)

	if (!hasEnoughDataForBranch(branchPayload)) {
		return {
			serviceMaster,
			serviceBranch: null,
			branchCreated: false
		}
	}

	const serviceBranch = await createServiceBranch({
		...branchPayload,
		masterServiceId: serviceMaster._id
	})

	return {
		serviceMaster,
		serviceBranch,
		branchCreated: true
	}
}

export const getServiceMastersByBusiness = async (businessId) => {
	if (!businessId) {
		throw new ServiceError('businessId es requerido', 400)
	}

	return ServiceMaster.find({ businessId, isArchived: false }).sort({ createdAt: -1 }).lean()
}

export const getServiceMasterById = async (id) => {
	if (!id) {
		throw new ServiceError('id es requerido', 400)
	}

	const serviceMaster = await ServiceMaster.findById(id).lean()
	if (!serviceMaster) {
		throw new ServiceError('ServiceMaster no encontrado', 404)
	}

	return serviceMaster
}

export const getServiceBranchesByStore = async (storeId) => {
	await validateStoreExists(storeId)

	return ServiceBranch.find({ storeId })
		.sort({ createdAt: -1 })
		.populate('masterServiceId')
		.lean()
}

export const getServiceBranchById = async (id) => {
	if (!id) {
		throw new ServiceError('id es requerido', 400)
	}

	const serviceBranch = await ServiceBranch.findById(id).populate('masterServiceId').lean()
	if (!serviceBranch) {
		throw new ServiceError('ServiceBranch no encontrado', 404)
	}

	return serviceBranch
}

export { ServiceError }
