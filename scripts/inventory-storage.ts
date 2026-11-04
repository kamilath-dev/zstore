import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { createInventoryWriter, parseFlags, validateTarget } from './inventory-common';

async function main() {
  const flags = parseFlags(
    process.argv.slice(2),
    ['project-id', 'bucket', 'confirm-target'],
    ['project-id', 'bucket', 'confirm-target']
  );
  const target = validateTarget(flags, 'storage');
  const app = initializeApp(
    { credential: applicationDefault(), projectId: target.projectId, storageBucket: target.bucket },
    `zstore-inventory-storage-${process.pid}`
  );
  const bucket = getStorage(app).bucket(target.bucket);
  const writer = createInventoryWriter(target.projectId, 'storage');
  let objectCount = 0;

  try {
    await writer.write({
      type: 'metadata',
      service: 'storage',
      projectId: target.projectId,
      bucket: target.bucket,
      generatedAt: new Date().toISOString(),
      customMetadataExcluded: true,
      downloadTokensExcluded: true
    });

    for await (const file of bucket.getFilesStream()) {
      objectCount += 1;
      const metadata = file.metadata;
      await writer.write({
        type: 'object',
        objectPath: file.name,
        size: metadata.size ?? null,
        contentType: metadata.contentType ?? null,
        md5Hash: metadata.md5Hash ?? null,
        crc32c: metadata.crc32c ?? null
      });
    }

    await writer.write({ type: 'summary', objectCount });
    await writer.complete();
    console.log(`Inventaire Storage terminé : ${objectCount} objets.`);
    console.log(`Rapport local : ${writer.finalPath}`);
    console.log('Tokens de téléchargement et métadonnées personnalisées exclus du rapport.');
  } catch (error) {
    console.error(`Inventaire Storage interrompu. Rapport partiel : ${writer.partialPath}`);
    throw error;
  } finally {
    await deleteApp(app);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
