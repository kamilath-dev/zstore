import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth, sendPasswordResetEmail } from '../../services/firebase';

interface AdminLoginPageProps {
  onSuccessNavigateDashboard: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccessNavigateDashboard,
  onNavigateHome
}) => {
  const { loginAdminWithEmail, firebaseUser, isAdmin, logout, isAuthLoading, refreshAdminClaims } = useAuth();

  const [email, setEmail] = useState('kamilathosseni4@gmail.com');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Password Reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('kamilathosseni4@gmail.com');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);
    setIsResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setIsResetLoading(false);
      setResetFeedback({
        type: 'success',
        message: `Un lien officiel Google/Firebase a été envoyé à "${resetEmail.trim()}". Ouvrez cet e-mail pour configurer ou réinitialiser votre mot de passe personnel.`
      });
    } catch (err: any) {
      setIsResetLoading(false);
      let msg = "Impossible d'envoyer l'e-mail de réinitialisation.";
      if (err?.code === 'auth/user-not-found') {
        msg = `Aucun compte n'a encore été créé pour "${resetEmail.trim()}" dans Firebase Authentication. Connectez-vous une première fois avec votre compte Google sur la boutique pour initialiser l'utilisateur.`;
      } else if (err?.code === 'auth/invalid-email') {
        msg = "Format d'adresse e-mail invalide.";
      }
      setResetFeedback({ type: 'error', message: msg });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await loginAdminWithEmail(email.trim(), password);
      setIsSubmitting(false);

      if (res.success && res.isAdmin) {
        onSuccessNavigateDashboard();
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || "Erreur lors de la connexion administrative.");
    }
  };

  const handleRefreshClaims = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    const hasAdmin = await refreshAdminClaims();
    setIsRefreshing(false);
    if (hasAdmin) {
      onSuccessNavigateDashboard();
    } else {
      setErrorMessage("Le jeton d'authentification a été actualisé mais ne contient toujours pas la Custom Claim 'admin: true'.");
    }
  };

  // If already authenticated and verified as admin
  if (firebaseUser && isAdmin) {
    return (
      <div className="min-h-screen bg-[#1c1917] text-[#faf8f5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#292524] rounded-3xl p-8 border border-amber-900/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/40">
              Session Direction Active
            </span>
            <h2 className="font-serif text-2xl font-bold text-white mt-3">
              Administrateur Authentifié
            </h2>
            <p className="text-xs text-stone-300 mt-2">
              Connecté en tant que <strong className="text-amber-200">{firebaseUser.email}</strong>.<br />
              Privilège <code className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">admin: true</code> vérifié avec succès.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onSuccessNavigateDashboard}
              className="w-full py-3.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition-all shadow-lg cursor-pointer"
            >
              Accéder au Tableau de Bord (/admin/dashboard)
            </button>
            <div className="flex gap-2">
              <button
                onClick={logout}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Changer de Compte
              </button>
              <button
                onClick={onNavigateHome}
                className="flex-1 py-2.5 border border-stone-700 hover:bg-stone-800 text-stone-400 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Retour Boutique
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1917] text-[#faf8f5] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-xs text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la Boutique ZStore</span>
        </button>

        <span className="text-[11px] font-mono text-stone-500 uppercase tracking-widest">
          Zone Sécurisée • ZStore Bénin
        </span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-[#262220] rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl space-y-6">
          
          {/* Brand & Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-700/40 text-amber-300 mb-1">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#f5efe6]">
              Portail Direction
            </h1>
            <p className="text-xs text-stone-400">
              Console de gestion des stocks, commandes et catalogue Cloud Firestore
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMessage}</p>
                {firebaseUser && !isAdmin && (
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    UID connecté : <code className="bg-black/40 px-1 py-0.5 rounded font-mono">{firebaseUser.uid}</code>.<br/>
                    Ce compte est authentifié comme client, mais n'a pas encore le rôle <code className="bg-black/40 px-1 py-0.5 rounded font-mono">admin: true</code> configuré via le SDK Firebase Admin.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-medium text-stone-400 mb-1.5 tracking-wider">
                Email Administrateur
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@zstore.bj"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1c1917] border border-stone-700 rounded-xl px-3.5 py-3 pl-10 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase font-medium text-stone-400 tracking-wider">
                  Mot de Passe Sécurisé
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetFeedback(null);
                    setShowResetModal(true);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1c1917] border border-stone-700 rounded-xl px-3.5 py-3 pl-10 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                />
                <Key className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification des Droits RBAC...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authentification Administrateur</span>
                </>
              )}
            </button>
          </form>

          {/* Authenticated user but not admin state */}
          {firebaseUser && !isAdmin && (
            <div className="pt-2 border-t border-stone-800 space-y-2">
              <button
                type="button"
                onClick={handleRefreshClaims}
                disabled={isRefreshing}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Réactualiser mes Custom Claims</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full text-center text-xs text-stone-400 hover:text-stone-200 underline cursor-pointer"
              >
                Se déconnecter de ce compte client
              </button>
            </div>
          )}

          {/* Toggle Setup Guide */}
          <div className="pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-amber-300 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                Procédure de configuration du 1er Administrateur
              </span>
              <span>{showSetupGuide ? '▲' : '▼'}</span>
            </button>

            {showSetupGuide && (
              <div className="mt-3 p-4 bg-[#1c1917] rounded-xl border border-stone-800 text-[11px] text-stone-300 space-y-3 leading-relaxed">
                <p className="font-semibold text-amber-300 flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" />
                  Prévisualisation du futur accès :
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-400">
                  <li>Inscrivez ou connectez votre compte Firebase Auth (ex: <span className="text-stone-200 font-mono">kamilathosseni4@gmail.com</span>).</li>
                  <li>Après autorisation explicite, exécutez d’abord le mode aperçu :
                    <pre className="bg-stone-900 text-amber-200 p-2 rounded mt-1 font-mono text-[10px] overflow-x-auto">
{`npm run set-admin -- kamilathosseni4@gmail.com`}
                    </pre>
                  </li>
                  <li>Une attribution effective exige <code>--apply</code> et une confirmation interactive liée à l’UID. Aucun privilège n’est attribué actuellement.</li>
                  <li>Le compte doit être vérifié dans Firebase Authentication; ne créez pas de compte fictif.</li>
                </ol>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#262220] border border-stone-700 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Key className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-white">Définir / Réinitialiser le Mot de Passe</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-stone-400 hover:text-white p-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Un lien officiel sécurisé Google Firebase vous sera envoyé par e-mail. Il vous permettra de définir votre mot de passe administrateur personnel en toute confidentialité, sans jamais le stocker dans le code source ni dans Firestore.
            </p>

            {resetFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  resetFeedback.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-700/60 text-rose-200'
                }`}
              >
                {resetFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <p>{resetFeedback.message}</p>
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-medium text-stone-400 mb-1.5 tracking-wider">
                  Adresse Email du Compte Administrateur
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-[#1c1917] border border-stone-700 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-stone-100 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                  />
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isResetLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Envoi du lien sécurisé...</span>
                    </>
                  ) : (
                    <span>Envoyer l'e-mail de configuration</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-3 border border-stone-700 hover:bg-stone-800 text-stone-400 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-[11px] text-stone-600">
        ZStore Bénin • Contrôle d'accès basé sur les rôles (RBAC) & Cloud Firestore Sécurisé
      </div>
    </div>
  );
};
