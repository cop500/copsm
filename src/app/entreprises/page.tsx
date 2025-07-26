"use client";

export default function EntreprisesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f4f4]">
      <div className="bg-white rounded-xl shadow-lg p-10 text-center max-w-2xl">
        <h1 className="text-3xl font-bold text-[#004080] mb-6">
          Espace Entreprises - COP Souss Massa
        </h1>
        <p className="mb-8 text-lg text-gray-700">
          Vous êtes une entreprise partenaire ? Déposez votre demande de recrutement ou d'événement en quelques clics.
        </p>
        
        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-[#004080] mb-2">📋 Demande de recrutement</h3>
            <p className="text-gray-600">Décrivez vos besoins en stagiaires ou techniciens</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-[#004080] mb-2">🎯 Organisation d'événement</h3>
            <p className="text-gray-600">Planifiez un job day ou un événement de recrutement</p>
          </div>
        </div>

        <a
          href="/demande-entreprise"
          className="inline-block px-8 py-4 bg-[#004080] text-white rounded-lg font-semibold text-lg hover:bg-blue-900 transition-colors"
        >
          Déposer votre demande
        </a>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Vous êtes un membre du COP ? <a href="/login" className="text-[#004080] hover:underline">Connectez-vous ici</a></p>
        </div>
      </div>
    </div>
  );
}