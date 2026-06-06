import { redirect } from 'next/navigation';

/** Legacy route — account management lives in the sidebar selector. */
export default function AccountsRedirectPage() {
  redirect('/dashboard');
}
