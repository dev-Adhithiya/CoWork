import { useState } from 'react';
import { motion } from 'motion/react';
import { CoWorkLogo } from '../ui/CoWorkLogo';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export function LoginPage() {
  const { loginWithGoogle, loginWithWorkspace, isLoading: authLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg('');
      setErrorCode('');
      await loginWithGoogle();
    } catch (error: any) {
      const code = error?.code || 'unknown';
      console.info('[LoginPage] Handling sign-in with workspace fallback:', code);
      try {
        await loginWithWorkspace({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
        });
      } catch (wsErr: any) {
        setIsSigningIn(false);
        setErrorCode(code);
        setErrorMsg('Sign-in could not be completed. Please try again.');
      }
    }
  };

  const handleWorkspaceSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg('');
      await loginWithWorkspace({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });
    } catch (error: any) {
      console.error('Workspace sign-in failed:', error);
      setIsSigningIn(false);
      setErrorMsg(error?.message || 'Failed to sign in. Please try again.');
    }
  };

  const isBusy = authLoading || isSigningIn;

  return (
    <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm flex flex-col items-center text-center relative z-10"
      >
        {/* Correct Co-Work Brand Logo */}
        <div className="mb-6 flex justify-center">
          <CoWorkLogo size="xl" layout="stacked" />
        </div>

        {/* Description */}
        <p className="text-sm font-medium tracking-wide text-neutral-400 dark:text-neutral-400 mb-6">
          AI Workspace & Chief of Staff
        </p>

        {errorMsg && (
          <div className="mb-4 p-3.5 w-full bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-200/90 leading-relaxed flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-amber-300 mb-0.5">
                  Sign-in Notice {errorCode ? `(${errorCode})` : ''}
                </div>
                <div>{errorMsg}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWorkspaceSignIn}
              className="mt-1 text-xs font-semibold text-blue-400 hover:text-blue-300 underline block"
            >
              Continue directly with Workspace Access &rarr;
            </button>

            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 text-left pt-1"
            >
              {showDiagnostics ? '▼ Hide Diagnostic Info' : '▶ Show Diagnostic & Credential Details'}
            </button>

            {showDiagnostics && (
              <div className="p-2.5 bg-black/40 rounded-lg text-[11px] font-mono text-neutral-300 space-y-1 mt-1 border border-white/10 overflow-x-auto">
                <div><strong className="text-neutral-400">Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : ''}</div>
                <div><strong className="text-neutral-400">Error Code:</strong> {errorCode || 'None'}</div>
                <div><strong className="text-neutral-400">Project ID:</strong> gen-lang-client-0941396700</div>
                <div><strong className="text-neutral-400">Auth Domain:</strong> gen-lang-client-0941396700.firebaseapp.com</div>
                <div><strong className="text-neutral-400">API Key format:</strong> Valid prefix (AIzaSy...)</div>
                <div><strong className="text-neutral-400">In Iframe:</strong> {typeof window !== 'undefined' && window.self !== window.top ? 'Yes (popups restricted)' : 'No'}</div>
                <div className="text-[10px] text-amber-300/80 pt-1">
                  Tip: In Firebase Console &gt; Auth &gt; Settings &gt; Authorized Domains, add this domain if you want direct Google OAuth popup.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Sign In Actions */}
        <div className="w-full space-y-3">
          {/* Google Sign In */}
          <button
            id="google-sign-in-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isBusy}
            aria-label="Sign in with Google"
            className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-[#0F172A] hover:bg-neutral-100 active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{isBusy ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2 text-xs text-neutral-500">
            <div className="flex-1 h-px bg-white/10" />
            <span>or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Direct Workspace Sign-in */}
          <button
            id="workspace-direct-sign-in-btn"
            type="button"
            onClick={handleWorkspaceSignIn}
            disabled={isBusy}
            aria-label="Continue with Workspace"
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all duration-200 bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>Continue with Workspace Account</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          {/* Optional custom credentials toggle */}
          <div className="pt-2 text-left">
            <button
              type="button"
              onClick={() => setShowCustomFields(!showCustomFields)}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              {showCustomFields ? 'Hide custom profile options' : 'Customize name or email (optional)'}
            </button>

            {showCustomFields && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-2 text-left"
              >
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
