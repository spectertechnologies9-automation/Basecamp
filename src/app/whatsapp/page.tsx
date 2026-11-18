import { redirect } from 'next/navigation';

export default function WhatsAppPage() {
  redirect('/dashboard?tab=whatsapp');
}
