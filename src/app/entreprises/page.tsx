"use client";

export default function EntreprisesPage() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative bg-gradient-to-br from-blue-900 to-blue-700"
      style={{
        backgroundImage: "url('/bg-entreprise.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay bleu pour lisibilité */}
      <div className="absolute inset-0 bg-blue-900 opacity-60 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen">
        <div className="bg-transparent backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8 md:p-10 text-center max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#004080] mb-3 sm:mb-4">
            Vous êtes une entreprise partenaire !
          </h1>
          <p className="mb-6 sm:mb-8 text-base sm:text-lg text-gray-800 font-medium">
            Déposez votre demande en quelques clics.
          </p>

          <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-4 sm:p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer min-h-[80px] sm:min-h-[90px] flex flex-col justify-center">
              <h3 className="font-bold text-white mb-2 text-base sm:text-lg">📋 Demande de recrutement</h3>
              <p className="text-white font-medium text-sm sm:text-base">Décrivez vos besoins en recrutement</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-4 sm:p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer min-h-[80px] sm:min-h-[90px] flex flex-col justify-center">
              <h3 className="font-bold text-white mb-2 text-base sm:text-lg">🎯 Organisation d'événement</h3>
              <p className="text-white font-medium text-sm sm:text-base">Planifiez un job day ou un événement de recrutement</p>
            </div>
          </div>

          <a
            href="/demande-entreprise"
            className="inline-block px-8 sm:px-10 py-4 bg-[#004080] text-white rounded-lg font-bold text-base sm:text-lg hover:bg-blue-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[48px] flex items-center justify-center"
          >
            Déposer votre demande
          </a>
        </div>
      </div>
    </div>
  );
}