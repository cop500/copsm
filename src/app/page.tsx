"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers la page de login
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f4f4]">
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <h1 className="text-3xl font-bold text-[#004080] mb-6">
          Centre d'Orientation Professionnelle
        </h1>
        <p className="mb-8 text-lg text-gray-700">
          Redirection vers la page de connexion...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004080] mx-auto"></div>
      </div>
    </div>
  );
}