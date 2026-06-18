import type { CrimeScene } from '@/types/crimeScene';

/** User may submit a new “request to update” (not while a request or revision is already waiting). */
export function sceneMayRequestUpdate(scene: CrimeScene): boolean {
  if (scene.cvrAmendment?.revisionPending) return false;
  if (scene.cvrAmendment?.requestStatus === 'pending') return false;
  return true;
}

/** Approver granted edit access; user can open the full form and save for re-approval. */
export function sceneMayEditAmended(scene: CrimeScene): boolean {
  return scene.cvrAmendment?.requestStatus === 'approved' && !scene.cvrAmendment?.revisionPending;
}

/** Waiting for approver to accept or reject the amended record. */
export function sceneHasRevisionPending(scene: CrimeScene): boolean {
  return scene.cvrAmendment?.revisionPending === true;
}
