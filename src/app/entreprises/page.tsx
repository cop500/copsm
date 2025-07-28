"use client";

export default function EntreprisesPage() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: "url('/bg-entreprise.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay bleu pour lisibilité */}
      <div className="absolute inset-0 bg-blue-900 opacity-60 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen">
        <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 sm:p-10 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#004080] mb-2">
            Vous êtes une entreprise partenaire
          </h1>
          <p className="mb-8 text-lg text-gray-700 font-medium">
            Déposez votre demande de recrutement ou d'événement en quelques clics.
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-400 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">📋 Demande de recrutement</h3>
              <p className="text-white">Décrivez votre besoin en profil</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">🎯 Organisation d'événement</h3>
              <p className="text-white">Planifiez un job day ou un événement de recrutement</p>
            </div>
          </div>

          <a
            href="/demande-entreprise"
            className="inline-block px-8 py-4 bg-[#004080] text-white rounded-lg font-semibold text-lg hover:bg-blue-900 transition-colors"
          >
            Déposer votre demande
          </a>
        </div>
      </div>
    </div>
  );
}