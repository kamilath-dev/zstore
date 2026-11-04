import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createInventoryWriter, parseFlags, validateTarget } from './inventory-common';

async function main() {
  const flags = parseFlags(
    process.argv.slice(2),
    ['project-id', 'confirm-target'],
    ['project-id', 'confirm-target']
  );
  const target = validateTarget(flags, 'auth');
  const app = initializeApp(
    { credential: applicationDefault(), projectId: target.projectId },
    `zstore-inventory-auth-${process.pid}`
  );
  const auth = getAuth(app);
  const writer = createInventoryWriter(target.projectId, 'auth');
  let userCount = 0;
  let pageToken: string | undefined;

  try {
    await writer.write({
      type: 'metadata',
      service: 'auth',
      projectId: target.projectId,
      generatedAt: new Date().toISOString(),
      emailsExcluded: true,
      tokensAndClaimsExcluded: true
    });

    do {
      const page = await auth.listUsers(1000, pageToken);
      for (const user of page.users) {
        userCount += 1;
        await writer.write({
          type: 'user',
          uid: user.uid,
          providerIds: user.providerData.map(provider => provider.providerId).sort(),
          disabled: user.disabled,
          emailVerified: user.emailVerified
        });
      }
      pageToken = page.pageToken;
    } while (pageToken);

    await writer.write({ type: 'summary', userCount });
    await writer.complete();
    console.log(`Inventaire Authentication terminé : ${userCount} utilisateurs.`);
    console.log(`Rapport local : ${writer.finalPath}`);
    console.log('Emails, mots de passe, tokens et custom claims ne figurent pas dans le rapport.');
  } catch (error) {
    console.error(`Inventaire Authentication interrompu. Rapport partiel : ${writer.partialPath}`);
    throw error;
  } finally {
    await deleteApp(app);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
