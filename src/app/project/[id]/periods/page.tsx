"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectPeriodsRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    const idRaw = (params as Record<string, string | string[]>)['id'];
    const id = typeof idRaw === 'string' ? idRaw : '';
    router.replace(`/project/${id}`);
  }, [params, router]);
  return null;
}
