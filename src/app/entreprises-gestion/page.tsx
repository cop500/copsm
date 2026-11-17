"use client";
import { Suspense } from "react";
import EntreprisesForm from "@/components/EntreprisesForm";

export default function EntreprisesGestionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="p-8 text-sm text-slate-500">Chargement…</div>}>
        <EntreprisesForm />
      </Suspense>
    </div>
  );
} 