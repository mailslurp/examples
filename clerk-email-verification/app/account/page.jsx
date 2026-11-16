import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Account() {
  const user = await currentUser();
  if (!user) redirect('/sign-up');
  const address = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
  return <main style={{ maxWidth: 480, margin: '10vh auto', padding: 32, border: '1px solid #d8d5de', borderRadius: 12 }}>
    <h1>Your account</h1><p>Primary email</p><output aria-label="Account email">{address?.emailAddress}</output>
    <p>Email verification: <strong>{address?.verification?.status}</strong></p>
  </main>;
}
