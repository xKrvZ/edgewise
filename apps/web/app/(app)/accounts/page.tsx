import { redirect } from 'next/navigation';

/** Legacy route — journal management lives in account settings. */
export default function AccountsRedirectPage() {
  redirect('/account#trading-accounts');
}
