import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import {
  FieldPath,
  getFirestore,
  type CollectionReference,
  type QueryDocumentSnapshot
} from 'firebase-admin/firestore';
import {
  createInventoryWriter,
  describeFirestoreType,
  parseFlags,
  validateTarget
} from './inventory-common';

interface CollectionSummary {
  documentCount: number;
  fieldTypes: Map<string, Set<string>>;
}

async function main() {
  const flags = parseFlags(
    process.argv.slice(2),
    ['project-id', 'database-id', 'confirm-target'],
    ['project-id', 'database-id', 'confirm-target']
  );
  const target = validateTarget(flags, 'firestore');
  const app = initializeApp(
    { credential: applicationDefault(), projectId: target.projectId },
    `zstore-inventory-firestore-${process.pid}`
  );
  const databaseId = target.databaseId;
  if (!databaseId) throw new Error('Un Database ID explicite est requis.');
  const db = getFirestore(app);
  const writer = createInventoryWriter(target.projectId, 'firestore');
  const summaries = new Map<string, CollectionSummary>();

  async function visitCollection(collection: CollectionReference): Promise<void> {
    const collectionPath = collection.path;
    const summary: CollectionSummary = {
      documentCount: 0,
      fieldTypes: new Map()
    };
    summaries.set(collectionPath, summary);

    let cursor: QueryDocumentSnapshot | undefined;
    while (true) {
      let query = collection.orderBy(FieldPath.documentId()).limit(500);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      if (page.empty) break;

      for (const document of page.docs) {
        summary.documentCount += 1;
        await writeDocument(document, collectionPath, summary);

        const children = await document.ref.listCollections();
        children.sort((left, right) => left.path.localeCompare(right.path));
        for (const child of children) {
          await visitCollection(child);
        }
      }

      cursor = page.docs[page.docs.length - 1];
      if (page.size < 500) break;
    }
  }

  async function writeDocument(
    document: QueryDocumentSnapshot,
    collectionPath: string,
    summary: CollectionSummary
  ): Promise<void> {
    const data = document.data();
    const fields: Record<string, string> = {};
    for (const key of Object.keys(data).sort()) {
      const type = describeFirestoreType(data[key]);
      fields[key] = type;
      const typeSet = summary.fieldTypes.get(key) || new Set<string>();
      typeSet.add(type);
      summary.fieldTypes.set(key, typeSet);
    }

    await writer.write({
      type: 'document',
      collectionPath,
      documentId: document.id,
      fields
    });
  }

  try {
    await writer.write({
      type: 'metadata',
      service: 'firestore',
      projectId: target.projectId,
      databaseId,
      generatedAt: new Date().toISOString(),
      valuesExcluded: true
    });

    const roots = await db.listCollections();
    roots.sort((left, right) => left.path.localeCompare(right.path));
    for (const collection of roots) {
      await visitCollection(collection);
    }

    await writer.write({
      type: 'summary',
      collections: [...summaries.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, summary]) => ({
          path,
          documentCount: summary.documentCount,
          fieldTypes: Object.fromEntries(
            [...summary.fieldTypes.entries()]
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([field, types]) => [field, [...types].sort()])
          )
        }))
    });
    await writer.complete();

    const documentCount = [...summaries.values()]
      .reduce((total, summary) => total + summary.documentCount, 0);
    console.log(`Inventaire Firestore terminé : ${summaries.size} collections, ${documentCount} documents.`);
    console.log(`Rapport local : ${writer.finalPath}`);
    console.log('Aucune valeur de document n’a été écrite dans le rapport.');
  } catch (error) {
    console.error(`Inventaire Firestore interrompu. Rapport partiel : ${writer.partialPath}`);
    throw error;
  } finally {
    await deleteApp(app);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
