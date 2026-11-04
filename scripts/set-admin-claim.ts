import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const PROJECT_ID = 'zstore-7ed88';
const OWNER_EMAIL = 'kamilathosseni4@gmail.com';
const app = initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID
});
const auth = getAuth(app);

async function main() {
  const args = process.argv.slice(2);
  const target = args.find(arg => !arg.startsWith('--'));
  const apply = args.includes('--apply');
  const revoke = args.includes('--revoke');
  const unknownArgs = args.filter(arg =>
    arg !== target && arg !== '--apply' && arg !== '--revoke'
  );
  if (unknownArgs.length || !target || args.filter(arg => arg === '--apply').length > 1 ||
      args.filter(arg => arg === '--revoke').length > 1) {
    throw new Error(
      'Usage: npm run set-admin -- kamilathosseni4@gmail.com [--revoke] [--apply]'
    );
  }
  if (target.toLowerCase() !== OWNER_EMAIL) {
    throw new Error(`Ce script ne peut cibler que le compte propriétaire ${OWNER_EMAIL}.`);
  }

  const user = await auth.getUserByEmail(OWNER_EMAIL);
  if (!user.emailVerified) {
    throw new Error('Le compte Firebase Authentication doit avoir une adresse e-mail vérifiée.');
  }
  const currentClaims = user.customClaims || {};
  const updatedClaims = { ...currentClaims };
  if (revoke) delete updatedClaims.admin;
  else updatedClaims.admin = true;

  const action = revoke ? 'révoquer' : 'attribuer';
  console.log(`Projet Firebase Authentication fixe : ${PROJECT_ID}`);
  console.log(`Compte vérifié : ${OWNER_EMAIL}`);
  console.log(`UID : ${user.uid}`);
  console.log(`Action prévue : ${action} le custom claim admin.`);
  console.log(`Claims présents : ${Object.keys(currentClaims).sort().join(', ') || '(aucun)'}`);

  if (!apply) {
    console.log('Mode aperçu : aucune modification distante effectuée.');
    console.log('Pour une opération future autorisée, ajouter --apply puis saisir la confirmation demandée.');
    return;
  }

  const confirmation = revoke
    ? `REVOKE ADMIN ${user.uid}`
    : `GRANT ADMIN ${user.uid}`;
  const readline = createInterface({ input: stdin, output: stdout });
  let answer: string;
  try {
    answer = await readline.question(`Saisissez exactement "${confirmation}" pour continuer : `);
  } finally {
    readline.close();
  }
  if (answer.trim() !== confirmation) {
    throw new Error('Confirmation incorrecte. Aucun changement appliqué.');
  }

  await auth.setCustomUserClaims(user.uid, updatedClaims);
  if (revoke) {
    await auth.revokeRefreshTokens(user.uid);
  }
  console.log(`Custom claim ${revoke ? 'révoqué' : 'attribué'} pour ${user.uid}.`);
  console.log('Aucun document Firestore admins n’a été créé ou modifié.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
