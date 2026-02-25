import express from 'express';
import Role from '../models/Role.js';
import Module from '../models/Module.js';

const router = express.Router();

// Create - Crear un nuevo rol
router.post('/create', async (req, res) => {
  try {
    const { brandId, name, permissions } = req.body;

    // Validar campos requeridos
    if (!brandId || !name) {
      return res.status(400).json({ 
        message: 'El ID de la marca y el nombre del rol son requeridos' 
      });
    }

    // Verificar si el rol ya existe en esa marca
    const existingRole = await Role.findOne({ brandId, name });
    
    if (existingRole) {
      return res.status(400).json({ 
        message: 'Ya existe un rol con ese nombre en esta marca' 
      });
    }

    // Validar que los permisos existan (si se proporcionan)
    if (permissions && permissions.length > 0) {
      const moduleIds = await Module.find({ _id: { $in: permissions } }).select('_id');
      const validModuleIds = moduleIds.map(m => m._id);
      const invalidPermissions = permissions.filter(p => !validModuleIds.includes(p));
      
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ 
          message: 'Algunos permisos no existen',
          invalidPermissions: invalidPermissions
        });
      }
    }

    // Crear el nuevo rol
    const newRole = new Role({
      brandId,
      name,
      permissions: permissions || []
    });

    await newRole.save();

    res.status(201).json({ 
      message: 'Rol creado exitosamente',
      role: newRole
    });

  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ 
      message: 'Error al crear rol', 
      error: error.message 
    });
  }
});

// GetAll - Obtener todos los roles (opcionalmente filtrados por marca)
router.get('/getAll', async (req, res) => {
  try {
    const { brandId } = req.query;
    
    const filter = brandId ? { brandId } : {};
    const roles = await Role.find(filter).populate('permissions');

    res.status(200).json({
      message: 'Roles obtenidos exitosamente',
      count: roles.length,
      roles: roles
    });

  } catch (error) {
    console.error('Error en getAll:', error);
    res.status(500).json({ 
      message: 'Error al obtener roles', 
      error: error.message 
    });
  }
});

// GetByBrandId - Obtener roles por ID de marca
router.get('/brand/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;

    const roles = await Role.find({ brandId }).populate('permissions');

    res.status(200).json({
      message: 'Roles obtenidos exitosamente',
      count: roles.length,
      roles: roles
    });

  } catch (error) {
    console.error('Error en getByBrandId:', error);
    res.status(500).json({ 
      message: 'Error al obtener roles', 
      error: error.message 
    });
  }
});

// GetById - Obtener un rol por ID
router.get('/getById/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id).populate('permissions');
    
    if (!role) {
      return res.status(404).json({ 
        message: 'Rol no encontrado' 
      });
    }

    res.status(200).json({
      message: 'Rol obtenido exitosamente',
      role: role
    });

  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ 
      message: 'Error al obtener rol', 
      error: error.message 
    });
  }
});

// Update - Actualizar un rol
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    // Buscar el rol
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({ 
        message: 'Rol no encontrado' 
      });
    }

    // Si se quiere cambiar el nombre, verificar que no exista otro rol con ese nombre en la misma marca
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ brandId: role.brandId, name });
      
      if (existingRole) {
        return res.status(400).json({ 
          message: 'Ya existe un rol con ese nombre en esta marca' 
        });
      }
      role.name = name;
    }

    // Actualizar permisos si se proporcionan
    if (permissions !== undefined) {
      // Validar que los permisos existan
      if (permissions.length > 0) {
        const moduleIds = await Module.find({ _id: { $in: permissions } }).select('_id');
        const validModuleIds = moduleIds.map(m => m._id);
        const invalidPermissions = permissions.filter(p => !validModuleIds.includes(p));
        
        if (invalidPermissions.length > 0) {
          return res.status(400).json({ 
            message: 'Algunos permisos no existen',
            invalidPermissions: invalidPermissions
          });
        }
      }
      role.permissions = permissions;
    }

    await role.save();

    res.status(200).json({
      message: 'Rol actualizado exitosamente',
      role: role
    });

  } catch (error) {
    console.error('Error en update:', error);
    res.status(500).json({ 
      message: 'Error al actualizar rol', 
      error: error.message 
    });
  }
});

// Delete - Eliminar un rol
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByIdAndDelete(id);
    
    if (!role) {
      return res.status(404).json({ 
        message: 'Rol no encontrado' 
      });
    }

    res.status(200).json({
      message: 'Rol eliminado exitosamente',
      role: role
    });

  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ 
      message: 'Error al eliminar rol', 
      error: error.message 
    });
  }
});

export const routeConfig = { path: "/v1/roles", router }

