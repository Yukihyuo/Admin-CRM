import mongoose from "mongoose";
import '../config/db.config.js'; // Al importar esto, se ejecuta la conexión automáticamente

import Page from "../models/Page.js";
import Module from "../models/Module.js";
import Role from "../models/Role.js";
import RoleAssignment from "../models/RoleAssignment.js";
// import User from "../models/User.js";



import Brand from "../models/Brand.js";
import Store from "../models/Store.js";
import Staff from "../models/Staff.js";

const seed = async () => {
  try {
    const insertedPages = await Page.insertMany([
      { name: "Dashboard", path: "/dashboard" },
      { name: "Pages", path: "/pages" },
      { name: "Roles", path: "/roles" },

      { name: "Brands", path: "/brands" },
      { name: "Stores", path: "/stores" },

      { name: "Staff", path: "/staff" },
      { name: "Clients", path: "/clients" },

      { name: "Inventory", path: "/inventory" },
      { name: "Sales", path: "/sales" },
      { name: "Schedule", path: "/schedule" },
    ]);

    const actions = [
      { suffix: 'create', code: 'C'},
      { suffix: 'read', code: 'R'},
      { suffix: 'update', code: 'U'},
      { suffix: 'delete', code: 'D'}
    ];


    // 3. Generamos el array de módulos vinculados a cada página
    const modulesToInsert = [];

    insertedPages.forEach(page => {
      actions.forEach(action => {
        modulesToInsert.push({
          pageId: page._id, // Relación con la página
          type: action.suffix, // Ej: create, read, update, delete
        });
      });
    });

    // 4. Insertamos todos los módulos de una sola vez
    const allModules = await Module.insertMany(modulesToInsert);
    const moduleIds = allModules.map(m => m._id);

    // 4. Crear Rol Admin de la Marca
    const brand = await Brand.create({ name: "CRM-Admin" });
    await Store.create({ name: "CRM-Admin Store", brandId: brand._id });

    const adminRole = await Role.create({
      name: "Super Admin",
      brandId: brand._id,
      permissions: moduleIds // Asignamos todos los módulos creados
    });



    // 5. Crear Usuario Admin (Staff)
    const user = await Staff.create({
      username: "admin",
      email: "danielperezglz123@gmail.com",
      password: "$2b$10$cpWyYov1iIKhm2NN1Mi6jeZVp7C3sCZ1NnY/tnvQqlWZvl18mTiJi",
      profile: {
        names: "Daniel",
        lastNames: "Pérez",
        phone: "123456789"
      }

    });

    await RoleAssignment.create({
      userId: user._id,
      roleId: adminRole._id,
      brandId: brand._id,
      scope: { type: 'brand' }
    });

    // Nota: Si usas RoleAssignments, también deberías crearlo aquí para el usuario.

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    // MUY IMPORTANTE: Cerramos la conexión para que el script termine
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
};

seed();