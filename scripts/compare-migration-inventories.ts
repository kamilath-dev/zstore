import { createInventoryWriter, parseFlags, readNdjson } from './inventory-common';
import path from 'node:path';

interface InventoryDocument {
  type: string;
  [key: string]: unknown;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function readInventory(filePath: string) {
  let metadata: InventoryDocument | undefined;
  const records = new Map<string, string>();
  const summaries: InventoryDocument[] = [];

  for await (const record of readNdjson(filePath)) {
    if (typeof record.type !== 'string') {
      throw new Error(`Ligne sans type dans ${path.basename(filePath)}.`);
    }
    if (record.type === 'metadata') {
      metadata = record as InventoryDocument;
      continue;
    }
    if (record.type === 'summary') {
      summaries.push(record as InventoryDocument);
      continue;
    }
    const identity =
      record.type === 'document'
        ? `document:${record.collectionPath}/${record.documentId}`
        : record.type === 'user'
          ? `user:${record.uid}`
          : record.type === 'object'
            ? `object:${record.objectPath}`
            : undefined;
    if (!identity) throw new Error(`Type de ligne non reconnu : ${String(record.type)}.`);
    records.set(identity, stableJson(record));
  }

  if (!metadata || summaries.length !== 1) {
    throw new Error(`Inventaire incomplet ou invalide : ${path.basename(filePath)}.`);
  }
  return { metadata, records, summary: summaries[0] };
}

async function main() {
  const flags = parseFlags(
    process.argv.slice(2),
    ['source', 'target'],
    ['source', 'target']
  );
  const sourcePath = path.resolve(flags.source);
  const targetPath = path.resolve(flags.target);
  const source = await readInventory(sourcePath);
  const target = await readInventory(targetPath);
  const sourceService = source.metadata.service;
  if (sourceService !== target.metadata.service) {
    throw new Error('Les inventaires doivent concerner le même service.');
  }

  const sourceKeys = new Set(source.records.keys());
  const targetKeys = new Set(target.records.keys());
  const missingInTarget = [...sourceKeys].filter(key => !targetKeys.has(key)).sort();
  const extraInTarget = [...targetKeys].filter(key => !sourceKeys.has(key)).sort();
  const changed = [...sourceKeys]
    .filter(key => targetKeys.has(key) && source.records.get(key) !== target.records.get(key))
    .sort();
  const projectId = String(target.metadata.projectId || 'target').replace(/[^a-zA-Z0-9_-]/g, '_');
  const writer = createInventoryWriter(projectId, `compare-${String(sourceService)}`);

  await writer.write({
    type: 'comparison',
    service: sourceService,
    sourceProjectId: source.metadata.projectId,
    targetProjectId: target.metadata.projectId,
    generatedAt: new Date().toISOString(),
    sourceRecordCount: source.records.size,
    targetRecordCount: target.records.size,
    missingInTargetCount: missingInTarget.length,
    extraInTargetCount: extraInTarget.length,
    changedRecordCount: changed.length
  });
  for (const identity of missingInTarget) {
    await writer.write({ type: 'difference', difference: 'missing-in-target', identity });
  }
  for (const identity of extraInTarget) {
    await writer.write({ type: 'difference', difference: 'extra-in-target', identity });
  }
  for (const identity of changed) {
    await writer.write({ type: 'difference', difference: 'record-changed', identity });
  }
  await writer.write({
    type: 'summary-comparison',
    source: source.summary,
    target: target.summary
  });
  await writer.complete();

  console.log(`Comparaison ${String(sourceService)} terminée.`);
  console.log(`Absents de la cible : ${missingInTarget.length}; supplémentaires : ${extraInTarget.length}; différents : ${changed.length}.`);
  console.log(`Rapport local : ${writer.finalPath}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
