import dotenv from 'dotenv';
import { createPortalAccount } from './portal-service.js';

dotenv.config({ path: ['.env.local', '.env'] });
// Server-only bootstrap: never expose this as a public signup endpoint.
try {
  const result = await createPortalAccount('office', {
    identifier: process.env.AGRISENCE_ADMIN_ID,
    password: process.env.AGRISENCE_ADMIN_PASSWORD,
    fullName: process.env.AGRISENCE_ADMIN_NAME,
    district: process.env.AGRISENCE_ADMIN_DISTRICT || 'National',
  }, 'server-bootstrap', true);
  console.log(`Owner account created. Sign in at /office/login with official ID: ${result.identifier}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Admin setup failed.');
  process.exitCode = 1;
}
