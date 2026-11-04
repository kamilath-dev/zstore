import { createWriteStream, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import type { WriteStream } from 'node:fs';

export interface InventoryTarget {
  projectId: string;
  databaseId?: string;
  bucket?: string;
}

const TARGET_PROJECT_ID = 'zstore-7ed88';
const TARGET_DATABASE_ID = '(default)';
const TARGET_BUCKET = 'zstore-7ed88.firebasestorage.app';

export interface InventoryWriter {
  readonly partialPath: string;
  readonly finalPath: string;
  write(record: unknown): Promise<void>;
  complete(): Promise<void>;
}

export function parseFlags(
  args: string[],
  required: string[],
  allowed: string[]
): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const separator = arg.indexOf('=');
    if (!arg.startsWith('--') || separator < 3) {
      throw new Error(`Argument invalide : ${arg}. Format attendu : --nom=valeur.`);
    }

    const name = arg.slice(2, separator);
    const value = arg.slice(separator + 1);
    if (!allowed.includes(name)) {
      throw new Error(`Option inconnue : --${name}.`);
    }
    if (!value || parsed[name]) {
      throw new Error(`Option manquante ou répétée : --${name}.`);
    }

    parsed[name] = value;
  }

  for (const name of required) {
    if (!parsed[name]) {
      throw new Error(`Option obligatoire absente : --${name}=...`);
    }
  }

  return parsed;
}

export function validateTarget(
  flags: Record<string, string>,
  kind: 'firestore' | 'auth' | 'storage'
): InventoryTarget {
  const projectId = flags['project-id'];
  const databaseId = flags['database-id'];
  const bucket = flags.bucket;
  if (projectId !== TARGET_PROJECT_ID) {
    throw new Error(`Projet refusé : seuls les inventaires de ${TARGET_PROJECT_ID} sont autorisés.`);
  }
  if (kind === 'firestore' && databaseId !== TARGET_DATABASE_ID) {
    throw new Error(`Base refusée : Firestore doit cibler ${TARGET_DATABASE_ID}.`);
  }
  if (kind === 'storage' && bucket !== TARGET_BUCKET) {
    throw new Error(`Bucket refusé : Storage doit cibler ${TARGET_BUCKET}.`);
  }

  const expectedConfirmation =
    kind === 'firestore'
      ? `${projectId}/${databaseId}`
      : kind === 'storage'
        ? `${projectId}/${bucket}`
        : projectId;

  if (!projectId || flags['confirm-target'] !== expectedConfirmation) {
    throw new Error(
      `Cible non confirmée. Pour continuer, --confirm-target doit être exactement "${expectedConfirmation}".`
    );
  }
  if (kind === 'firestore' && !databaseId) {
    throw new Error('Un Database ID explicite est requis.');
  }
  if (kind === 'storage' && !bucket) {
    throw new Error('Un nom de bucket explicite est requis.');
  }

  return { projectId, databaseId, bucket };
}

export function createInventoryWriter(
  projectId: string,
  kind: string
): InventoryWriter {
  const safeProject = projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeKind = kind.replace(/[^a-zA-Z0-9_-]/g, '_');
  const directory = path.resolve(process.cwd(), '.migration-inventory', safeProject);
  mkdirSync(directory, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `${safeKind}-${timestamp}-${process.pid}.ndjson`;
  const finalPath = path.join(directory, baseName);
  const partialPath = `${finalPath}.partial`;
  const stream: WriteStream = createWriteStream(partialPath, {
    flags: 'wx',
    mode: 0o600
  });
  let streamError: Error | undefined;
  stream.on('error', error => {
    streamError = error;
  });

  return {
    partialPath,
    finalPath,
    async write(record: unknown) {
      if (streamError) throw streamError;
      const line = `${JSON.stringify(record)}\n`;
      await new Promise<void>((resolve, reject) => {
        stream.write(line, error => {
          if (error) reject(error);
          else if (streamError) reject(streamError);
          else resolve();
        });
      });
    },
    async complete() {
      if (streamError) throw streamError;
      await new Promise<void>((resolve, reject) => {
        stream.once('error', reject);
        stream.once('finish', resolve);
        stream.end();
      });
      renameSync(partialPath, finalPath);
    }
  };
}

export function describeFirestoreType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    const itemTypes = [...new Set(value.map(describeFirestoreType))].sort();
    return itemTypes.length ? `array<${itemTypes.join('|')}>` : 'array<empty>';
  }
  if (value instanceof Date) return 'timestamp';
  if (typeof value !== 'object') return typeof value;

  const constructorName = value.constructor?.name;
  if (constructorName && constructorName !== 'Object') {
    return constructorName;
  }

  const mapValue = value as Record<string, unknown>;
  const entries = Object.keys(mapValue)
    .sort()
    .map(key => `${JSON.stringify(key)}:${describeFirestoreType(mapValue[key])}`);
  return entries.length ? `map{${entries.join(',')}}` : 'map{}';
}

export async function* readNdjson(filePath: string): AsyncGenerator<Record<string, unknown>> {
  const absolutePath = path.resolve(filePath);
  const inventoryDirectory = path.resolve(process.cwd(), '.migration-inventory');
  const relativePath = path.relative(inventoryDirectory, absolutePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Les rapports doivent être lus depuis .migration-inventory.');
  }

  const input = createReadStreamForLines(absolutePath);
  for await (const line of input) {
    if (!line.trim()) continue;
    const value: unknown = JSON.parse(line);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`Ligne NDJSON invalide dans ${path.basename(absolutePath)}.`);
    }
    yield value as Record<string, unknown>;
  }
}

async function* createReadStreamForLines(filePath: string): AsyncGenerator<string> {
  const { createReadStream } = await import('node:fs');
  const { createInterface } = await import('node:readline');
  const lines = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });
  try {
    for await (const line of lines) yield line;
  } finally {
    lines.close();
  }
}
