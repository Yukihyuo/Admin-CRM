import express from 'express';
import cors from 'cors';

import "./src/config/db.config.js"

import staffRouter from './src/routes/Staff.js';
import rolesRouter from './src/routes/Roles.js';
import pagesRouter from './src/routes/Pages.js';
import productsRouter from './src/routes/Products.js';
import salesRouter from './src/routes/Sales.js';
import schedulesRouter from './src/routes/Schedules.js';
import analyticsRouter from './src/routes/Analytics.js';
import brandsRouter from './src/routes/Brands.js';
import storesRouter from './src/routes/Stores.js';
import clientsRouter from './src/routes/Clients.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/v1/staff', staffRouter);
app.use('/v1/roles', rolesRouter);
app.use("/v1/pages", pagesRouter);
app.use("/v1/products", productsRouter);
app.use("/v1/sales", salesRouter);
app.use("/v1/schedules", schedulesRouter);
app.use("/v1/analytics", analyticsRouter);
app.use("/v1/brands", brandsRouter);
app.use("/v1/stores", storesRouter);
app.use("/v1/clients", clientsRouter);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});