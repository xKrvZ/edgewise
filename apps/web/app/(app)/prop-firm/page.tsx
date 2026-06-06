import { redirect } from 'next/navigation';

/** Legacy route — prop-firm challenges are managed via account risk limits. */
export default function PropFirmRedirectPage() {
  redirect('/dashboard');
}
