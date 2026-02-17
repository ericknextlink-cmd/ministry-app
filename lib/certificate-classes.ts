/**
 * Certificate class hierarchy per guidelines: D1/K1 highest, D3/K3 lowest (building/civil);
 * E1 highest, E3 lowest (electrical); G1 highest, G2 lowest (plumbing).
 * Order: index 0 = lowest class, last = highest (so "upgrade" = move to higher index).
 */
export const CERTIFICATE_CLASS_ORDER: Record<
  "building" | "civil" | "electrical" | "plumbing",
  string[]
> = {
  building: ["D3K3", "D2K2", "D1K1"],
  civil: ["D3K3", "D2K2", "D1K1"],
  electrical: ["E3", "E2", "E1"],
  plumbing: ["G2", "G1"],
};

export type CertificateType = keyof typeof CERTIFICATE_CLASS_ORDER;

/** Classes the applicant can upgrade to from currentClass (higher classes only). Empty if already at max. */
export function getClassesUpgradeTo(
  certificateType: CertificateType,
  currentClass: string
): string[] {
  const order = CERTIFICATE_CLASS_ORDER[certificateType];
  if (!order || order.length === 0) return [];
  const idx = order.indexOf(currentClass);
  if (idx === -1) return [];
  return order.slice(idx + 1);
}

/** All classes for a certificate type (lowest to highest). */
export function getAllClasses(certificateType: CertificateType): string[] {
  return CERTIFICATE_CLASS_ORDER[certificateType] ?? [];
}

/** Whether the given class is the highest for that type (no upgrade possible). */
export function isHighestClass(certificateType: CertificateType, certClass: string): boolean {
  const order = CERTIFICATE_CLASS_ORDER[certificateType];
  if (!order || order.length === 0) return true;
  return order.indexOf(certClass) === order.length - 1;
}
