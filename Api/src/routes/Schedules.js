import express from 'express';
import Schedule from '../models/Schedule.js';
import Staff from '../models/Staff.js';
import Store from '../models/Store.js';
import RoleAssignment from '../models/RoleAssignment.js';

const router = express.Router();

const validateStoreExists = async (storeId) => {
  if (!storeId) return null;
  return Store.findById(storeId);
};

const validateUserHasStoreAccess = async (userId, store) => {
  if (!userId || !store) return false;

  const assignment = await RoleAssignment.findOne({
    userId,
    brandId: store.brandId,
    $or: [
      { 'scope.type': 'brand' },
      { 'scope.type': 'store', 'scope.targetId': store._id }
    ]
  });

  return !!assignment;
};

// Create - Crear un nuevo horario
router.post('/create', async (req, res) => {
  try {
    const { storeId, userId, validFrom, validUntil, days } = req.body;

    // Validar campos requeridos
    if (!storeId || !userId || !validFrom) {
      return res.status(400).json({ 
        message: 'StoreId, userId y validFrom son requeridos' 
      });
    }

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({
        message: 'Tienda no encontrada'
      });
    }

    // Verificar que el usuario existe
    const user = await Staff.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }

    const hasStoreAccess = await validateUserHasStoreAccess(userId, store);
    if (!hasStoreAccess) {
      return res.status(400).json({
        message: 'El usuario no tiene acceso a la tienda seleccionada'
      });
    }

    const validFromDate = new Date(validFrom);
    const validUntilDate = validUntil ? new Date(validUntil) : null;

    if (Number.isNaN(validFromDate.getTime())) {
      return res.status(400).json({
        message: 'validFrom inválido'
      });
    }

    if (validUntilDate && Number.isNaN(validUntilDate.getTime())) {
      return res.status(400).json({
        message: 'validUntil inválido'
      });
    }

    if (validUntilDate && validUntilDate < validFromDate) {
      return res.status(400).json({
        message: 'validUntil no puede ser menor que validFrom'
      });
    }

    // Validar estructura de días
    if (days && days.length > 0) {
      for (const day of days) {
        if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
          return res.status(400).json({ 
            message: 'dayOfWeek debe estar entre 0 (domingo) y 6 (sábado)' 
          });
        }
      }
    }

    // Crear el nuevo horario
    const newSchedule = new Schedule({
      storeId,
      userId,
      validFrom: validFromDate,
      validUntil: validUntilDate,
      days: days || []
    });

    await newSchedule.save();

    res.status(201).json({ 
      message: 'Horario creado exitosamente',
      schedule: newSchedule
    });

  } catch (error) {
    console.error('Error en create:', error);
    res.status(500).json({ 
      message: 'Error al crear horario', 
      error: error.message 
    });
  }
});

// GetAll - Obtener todos los horarios
router.get('/:storeId/getAll', async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({
        message: 'Tienda no encontrada'
      });
    }

    const schedules = await Schedule.find({ storeId })
      .sort({ validFrom: -1 });

    res.status(200).json({
      message: 'Horarios obtenidos exitosamente',
      count: schedules.length,
      schedules: schedules
    });

  } catch (error) {
    console.error('Error en getAll:', error);
    res.status(500).json({ 
      message: 'Error al obtener horarios', 
      error: error.message 
    });
  }
});

// GetById - Obtener un horario por ID
router.get('/:storeId/getById/:id', async (req, res) => {
  try {
    const { storeId, id } = req.params;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({
        message: 'Tienda no encontrada'
      });
    }

    const schedule = await Schedule.findOne({ _id: id, storeId })
      .populate('userId', 'username email profile');

    if (!schedule) {
      return res.status(404).json({ 
        message: 'Horario no encontrado' 
      });
    }

    res.status(200).json({
      message: 'Horario obtenido exitosamente',
      schedule: schedule
    });

  } catch (error) {
    console.error('Error en getById:', error);
    res.status(500).json({ 
      message: 'Error al obtener horario', 
      error: error.message 
    });
  }
});

// GetByUserId - Obtener horarios de un usuario específico
router.get('/:storeId/getByUserId/:userId', async (req, res) => {
  try {
    const { storeId, userId } = req.params;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({
        message: 'Tienda no encontrada'
      });
    }

    const schedules = await Schedule.find({ storeId, userId })
      .populate('userId', 'username email profile')
      .sort({ validFrom: -1 });

    res.status(200).json({
      message: 'Horarios obtenidos exitosamente',
      count: schedules.length,
      schedules: schedules
    });

  } catch (error) {
    console.error('Error en getByUserId:', error);
    res.status(500).json({ 
      message: 'Error al obtener horarios del usuario', 
      error: error.message 
    });
  }
});

// Update - Actualizar un horario
router.put('/:storeId/update/:id', async (req, res) => {
  try {
    const { storeId, id } = req.params;
    const { userId, validFrom, validUntil, days } = req.body;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({
        message: 'Tienda no encontrada'
      });
    }

    const schedule = await Schedule.findOne({ _id: id, storeId });

    if (!schedule) {
      return res.status(404).json({ 
        message: 'Horario no encontrado' 
      });
    }

    // Si se actualiza el userId, verificar que existe
    if (userId && userId !== schedule.userId) {
      const user = await Staff.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        });
      }

      const hasStoreAccess = await validateUserHasStoreAccess(userId, store);
      if (!hasStoreAccess) {
        return res.status(400).json({
          message: 'El usuario no tiene acceso a la tienda seleccionada'
        });
      }

      schedule.userId = userId;
    }

    // Actualizar campos
    if (validFrom) {
      const validFromDate = new Date(validFrom);
      if (Number.isNaN(validFromDate.getTime())) {
        return res.status(400).json({
          message: 'validFrom inválido'
        });
      }
      schedule.validFrom = validFromDate;
    }

    if (validUntil !== undefined) {
      if (!validUntil) {
        schedule.validUntil = null;
      } else {
        const validUntilDate = new Date(validUntil);
        if (Number.isNaN(validUntilDate.getTime())) {
          return res.status(400).json({
            message: 'validUntil inválido'
          });
        }
        schedule.validUntil = validUntilDate;
      }
    }

    if (schedule.validUntil && schedule.validUntil < schedule.validFrom) {
      return res.status(400).json({
        message: 'validUntil no puede ser menor que validFrom'
      });
    }

    if (days) {
      // Validar estructura de días
      for (const day of days) {
        if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
          return res.status(400).json({ 
            message: 'dayOfWeek debe estar entre 0 (domingo) y 6 (sábado)' 
          });
        }
      }
      schedule.days = days;
    }

    await schedule.save();

    res.status(200).json({ 
      message: 'Horario actualizado exitosamente',
      schedule: schedule
    });

  } catch (error) {
    console.error('Error en update:', error);
    res.status(500).json({ 
      message: 'Error al actualizar horario', 
      error: error.message 
    });
  }
});

// Delete - Eliminar un horario
router.delete('/:storeId/delete/:id', async (req, res) => {
  try {
    const { storeId, id } = req.params;

    const store = await validateStoreExists(storeId);
    if (!store) {
      return res.status(404).json({
        message: 'Tienda no encontrada'
      });
    }

    const schedule = await Schedule.findOneAndDelete({ _id: id, storeId });

    if (!schedule) {
      return res.status(404).json({ 
        message: 'Horario no encontrado' 
      });
    }

    res.status(200).json({ 
      message: 'Horario eliminado exitosamente',
      schedule: schedule
    });

  } catch (error) {
    console.error('Error en delete:', error);
    res.status(500).json({ 
      message: 'Error al eliminar horario', 
      error: error.message 
    });
  }
});

export default router;