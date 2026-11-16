import { ClerkProvider } from '@clerk/nextjs';

export const metadata = { title: 'Email verification with Clerk' };
export default function Layout({ children }) {
  return <html lang="en"><body style={{ fontFamily: 'system-ui, sans-serif' }}>
    <ClerkProvider signUpForceRedirectUrl="/account">{children}</ClerkProvider>
  </body></html>;
}
