import { prisma } from './db.js';

async function fixMyUser() {
  console.log("⏳ Sincronizando límites de almacenamiento...");
  try {
    // 10GB en bytes exactos
    const BYTES_10GB = BigInt(10737418240);

    const result = await prisma.user.updateMany({
      where: { plan: 'PRO' },
      data: {
        storageLimit: BYTES_10GB
      }
    });

    console.log(`✅ ¡Búnker actualizado! ${result.count} usuarios PRO ahora tienen 10GB.`);
  } catch (error) {
    console.error("❌ Error al actualizar:", error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

fixMyUser();