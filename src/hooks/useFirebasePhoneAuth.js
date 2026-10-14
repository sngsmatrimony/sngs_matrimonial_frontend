import { useRef, useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import { toastSuccess, toastError } from '@/lib/toast';
import { getFriendlyErrorMessage } from '@/lib/errorMessages';

/**
 * Firebase Phone Auth (mobile OTP) flow, shared between registration's
 * quick-start step, the login page's "Login with Mobile OTP" option, and
 * Edit Profile's mobile-number change.
 *
 * Real phone numbers always fail with auth/invalid-app-credential on
 * localhost (any Firebase project) — test locally with a Firebase test
 * number; real numbers only work on a deployed HTTPS domain that's in both
 * Firebase Authorized domains and the reCAPTCHA Web key's domain list.
 *
 * @param {string} containerId - id of a `<div>` this page renders for the
 *   invisible reCAPTCHA widget to attach to, e.g. `<div id={containerId} />`.
 */
export function useFirebasePhoneAuth(containerId) {
  const [mobileVerificationStep, setMobileVerificationStep] = useState('input'); // 'input', 'otp', 'verified'
  const [mobileOtpValue, setMobileOtpValue] = useState('');
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileIdToken, setMobileIdToken] = useState('');
  const [mobileResendTimer, setMobileResendTimer] = useState(0);
  const recaptchaVerifierRef = useRef(null);
  const recaptchaContainerRef = useRef(null);
  const mobileConfirmationResultRef = useRef(null);
  const lastMobileRef = useRef('');

  const clearRecaptchaVerifier = () => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch {
      // Already detached from a removed container — nothing left to clean up.
    }
    recaptchaVerifierRef.current = null;
    recaptchaContainerRef.current = null;
  };

  // Lazily creates (and reuses) the invisible reCAPTCHA widget Firebase
  // requires before it will send an SMS — reused across send/resend so a
  // retry doesn't re-render a second widget into the same container.
  const getRecaptchaVerifier = () => {
    const container = document.getElementById(containerId);
    // Pages unmount/remount this container (register's step 1, login's
    // Email/Mobile tabs); a widget bound to the old element can't render.
    if (recaptchaVerifierRef.current && recaptchaContainerRef.current !== container) {
      clearRecaptchaVerifier();
    }
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, container || containerId, {
        size: 'invisible',
      });
      recaptchaContainerRef.current = container;
    }
    return recaptchaVerifierRef.current;
  };

  const sendMobileOTP = async (mobile) => {
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      toastError('Please enter a valid 10-digit mobile number');
      return;
    }
    lastMobileRef.current = mobile;

    setMobileOtpLoading(true);
    try {
      const verifier = getRecaptchaVerifier();
      const confirmationResult = await signInWithPhoneNumber(firebaseAuth, `+91${mobile}`, verifier);
      mobileConfirmationResultRef.current = confirmationResult;
      toastSuccess('OTP sent to your mobile number');
      setMobileVerificationStep('otp');
      startMobileResendTimer();
    } catch (error) {
      console.error('Firebase phone OTP send error:', error);
      toastError(getFriendlyErrorMessage(error, 'We couldn’t send the verification code. Please try again.'));
      // The widget may now be in a used/invalid render state — drop it so
      // the next attempt creates a fresh one instead of silently failing again.
      clearRecaptchaVerifier();
    } finally {
      setMobileOtpLoading(false);
    }
  };

  const verifyMobileOTP = async () => {
    if (!mobileOtpValue || mobileOtpValue.length !== 6) {
      toastError('Please enter a valid 6-digit OTP');
      return;
    }
    if (!mobileConfirmationResultRef.current) {
      toastError('Please request a new OTP.');
      return;
    }

    setMobileOtpLoading(true);
    try {
      const result = await mobileConfirmationResultRef.current.confirm(mobileOtpValue);
      const idToken = await result.user.getIdToken();
      // The ID token is already captured above — our app doesn't otherwise
      // use Firebase's own auth state, so sign the browser back out of it
      // rather than leave a stray Firebase session sitting alongside ours.
      await firebaseAuth.signOut();
      setMobileIdToken(idToken);
      setMobileVerified(true);
      setMobileVerificationStep('verified');
      toastSuccess('Mobile number verified successfully.');
    } catch (error) {
      console.error('Firebase phone OTP verify error:', error);
      toastError(getFriendlyErrorMessage(error, 'That code didn’t match. Please check it and try again.'));
      setMobileOtpValue('');
    } finally {
      setMobileOtpLoading(false);
    }
  };

  const startMobileResendTimer = () => {
    setMobileResendTimer(60);
    const interval = setInterval(() => {
      setMobileResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resendMobileOTP = async () => {
    setMobileOtpValue('');
    setMobileIdToken('');
    mobileConfirmationResultRef.current = null;
    await sendMobileOTP(lastMobileRef.current);
  };

  // Lets the consuming page reset verification state when the mobile number
  // input changes after a successful verify (same pattern register/page.js
  // already applied inline before this extraction).
  const resetMobileVerification = () => {
    setMobileVerified(false);
    setMobileIdToken('');
    setMobileVerificationStep('input');
  };

  return {
    mobileVerificationStep,
    mobileOtpValue,
    setMobileOtpValue,
    mobileOtpLoading,
    mobileVerified,
    mobileIdToken,
    mobileResendTimer,
    sendMobileOTP,
    verifyMobileOTP,
    resendMobileOTP,
    resetMobileVerification,
  };
}
