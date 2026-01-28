import { AppTutorialsGate } from "@/components/app-tutorials-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AppTutorialsGate />
    </>
  );
}
