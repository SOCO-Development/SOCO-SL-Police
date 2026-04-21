import { redirect } from 'next/navigation';

export default function LegacyUpdateInvestigationRedirect() {
  redirect('/crime-visit-registry/production-analysis');
}
