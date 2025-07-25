"use client";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f4f4]">
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <h1 className="text-3xl font-bold text-[#004080] mb-6">
          Bienvenue sur l’espace entreprises du COP Souss Massa
        </h1>
        <p className="mb-8 text-lg text-gray-700">
          Vous êtes une entreprise ? Cliquez ci-dessous pour déposer votre demande de recrutement ou d’événement.
        </p>
        <a
          href="/demande-entreprise"
          className="inline-block px-8 py-4 bg-[#004080] text-white rounded-lg font-semibold text-lg hover:bg-blue-900 transition"
        >
          Déposer votre demande entreprise ici
        </a>
      </div>
    </div>
  );
}