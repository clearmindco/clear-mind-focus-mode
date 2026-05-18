import { LESSONS } from "@/lib/lessons";
import ModuleClient from "./ModuleClient";

export function generateStaticParams() {
  return LESSONS.map(l => ({ id: l.id }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ModuleClient id={id} />;
}
