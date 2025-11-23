const { initDB, getDB } = require('./src/config/database');

async function migrateRatings() {
  await initDB();
  const db = getDB();
  
  console.log('Verificando calificaciones sin categoría...');
  
  const ratingsWithoutCategoria = await db.all(`
    SELECT r.id, r.rating, r.comentario, r.categoria, p.categoria as pedido_categoria 
    FROM ratings r 
    LEFT JOIN pedidos p ON r.pedido_id = p.id
  `);
  
  console.log(`Total de calificaciones: ${ratingsWithoutCategoria.length}`);
  
  let updated = 0;
  for (const r of ratingsWithoutCategoria) {
    if (!r.categoria && r.pedido_categoria) {
      await db.run('UPDATE ratings SET categoria = ? WHERE id = ?', [r.pedido_categoria, r.id]);
      console.log(`Rating ${r.id}: actualizada con categoría "${r.pedido_categoria}"`);
      updated++;
    } else if (r.categoria) {
      console.log(`Rating ${r.id}: ya tiene categoría "${r.categoria}"`);
    } else {
      console.log(`Rating ${r.id}: no se puede determinar categoría`);
    }
  }
  
  console.log(`\n✅ Actualizadas ${updated} calificaciones`);
  process.exit(0);
}

migrateRatings().catch(err => {
  console.error('Error en migración:', err);
  process.exit(1);
});
