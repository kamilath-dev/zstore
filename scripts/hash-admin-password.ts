import bcrypt from 'bcryptjs';
import { stdin, stdout } from 'node:process';

async function main() {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Exécutez cette commande dans un terminal interactif pour masquer la saisie.');
  }

  stdout.write('Mot de passe administrateur (saisie masquée) : ');
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  const password = await new Promise<string>((resolve, reject) => {
    let value = '';
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cleanup();
          stdout.write('\n');
          reject(new Error('Génération annulée.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };
    stdin.on('data', onData);
  });

  if (password.length < 12) {
    throw new Error('Choisissez un mot de passe administrateur d’au moins 12 caractères.');
  }
  const hash = await bcrypt.hash(password, 12);
  console.log('Hash bcrypt à placer dans ADMIN_PASSWORD_HASH (ne partagez pas cette valeur) :');
  console.log(hash);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
