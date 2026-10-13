import Staff from "../models/Staff.js";

/**
 * El email pasó de ser obligatorio a opcional, así que su índice único necesita ser
 * `sparse`; de lo contrario dos usuarios sin email chocarían entre sí por el valor nulo.
 * Los índices ya creados no se actualizan solos (Staff tiene `autoIndex: false`), por eso
 * se comparan contra el schema al arrancar y se reconstruyen solo si hay diferencias.
 */
export const syncStaffIndexes = async () => {
  const { toDrop, toCreate } = await Staff.diffIndexes();

  if (toDrop.length === 0 && toCreate.length === 0) return;

  await Staff.syncIndexes();
  console.log(`[Indexes] Staff sincronizado: ${toDrop.length} índice(s) reconstruido(s), ${toCreate.length} creado(s).`);
};
