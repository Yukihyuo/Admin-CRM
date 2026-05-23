import express from "express"
import {
	createServiceMasterWithOptionalBranch,
	createServiceBranch,
	getServiceMastersByBusiness,
	getServiceMasterById,
	getServiceBranchesByStore,
	getServiceBranchById,
	ServiceError
} from "../services/Services.services.js"


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
		message: 'Error interno al procesar servicios',
		error: error.message
	})
}

// Create - Crear un ServiceMaster y opcionalmente un ServiceBranch
router.post('/master/create', async (req, res) => {
	try {
		const result = await createServiceMasterWithOptionalBranch(req.body)

		return res.status(201).json({
			message: result.branchCreated
				? 'ServiceMaster y ServiceBranch creados exitosamente'
				: 'ServiceMaster creado exitosamente',
			serviceMaster: result.serviceMaster,
			serviceBranch: result.serviceBranch,
			branchCreated: result.branchCreated
		})
	} catch (error) {
		return handleRouteError(error, res, 'master/create')
	}
})

// Create - Crear un ServiceBranch para un ServiceMaster existente
router.post('/branch/create', async (req, res) => {
	try {
		const serviceBranch = await createServiceBranch(req.body)

		return res.status(201).json({
			message: 'ServiceBranch creado exitosamente',
			serviceBranch
		})
	} catch (error) {
		return handleRouteError(error, res, 'branch/create')
	}
})

// GetAll - Obtener ServiceMaster por negocio
router.get('/master/:businessId/getAll', async (req, res) => {
	try {
		const { businessId } = req.params
		const services = await getServiceMastersByBusiness(businessId)

		return res.status(200).json({
			message: 'ServiceMaster obtenidos exitosamente',
			count: services.length,
			services
		})
	} catch (error) {
		return handleRouteError(error, res, 'master/getAll')
	}
})

// GetById - Obtener un ServiceMaster por ID
router.get('/master/getById/:id', async (req, res) => {
	try {
		const { id } = req.params
		const serviceMaster = await getServiceMasterById(id)

		return res.status(200).json({
			message: 'ServiceMaster obtenido exitosamente',
			serviceMaster
		})
	} catch (error) {
		return handleRouteError(error, res, 'master/getById')
	}
})

// GetAll - Obtener ServiceBranch por sucursal
router.get('/branch/:storeId/getAll', async (req, res) => {
	try {
		const { storeId } = req.params
		const services = await getServiceBranchesByStore(storeId)

		return res.status(200).json({
			message: 'ServiceBranch obtenidos exitosamente',
			count: services.length,
			services
		})
	} catch (error) {
		return handleRouteError(error, res, 'branch/getAll')
	}
})

// GetById - Obtener un ServiceBranch por ID
router.get('/branch/getById/:id', async (req, res) => {
	try {
		const { id } = req.params
		const serviceBranch = await getServiceBranchById(id)

		return res.status(200).json({
			message: 'ServiceBranch obtenido exitosamente',
			serviceBranch
		})
	} catch (error) {
		return handleRouteError(error, res, 'branch/getById')
	}
})


export const routeConfig = { path: "/v1/services", router }