import { useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';

declare global {
	interface Window {
		grecaptcha: any;
		onRecaptchaLoad: () => void;
	}
}

type RecaptchaOverlayProps = {
	onVerify: (token: string) => void;
	onClose: () => void;
};

const RECAPTCHA_SCRIPT_ID = 'recaptcha-script';
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function RecaptchaOverlay({
	onVerify,
	onClose,
}: RecaptchaOverlayProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<number | null>(null);

	const renderWidget = useCallback(() => {
		if (
			!containerRef.current ||
			widgetIdRef.current !== null ||
			!window.grecaptcha?.render
		)
			return;

		widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
			sitekey: SITE_KEY,
			callback: (token: string) => {
				onVerify(token);
			},
			'expired-callback': () => {
				widgetIdRef.current = null;
			},
			theme: document.documentElement.classList.contains('dark')
				? 'dark'
				: 'light',
		});
	}, [onVerify]);

	useEffect(() => {
		// If grecaptcha is already loaded, render immediately
		if (window.grecaptcha?.render) {
			renderWidget();
			return;
		}

		// Load the script if it hasn't been loaded yet
		if (!document.getElementById(RECAPTCHA_SCRIPT_ID)) {
			window.onRecaptchaLoad = renderWidget;

			const script = document.createElement('script');
			script.id = RECAPTCHA_SCRIPT_ID;
			script.src =
				'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		} else {
			// Script tag exists but might still be loading
			window.onRecaptchaLoad = renderWidget;
		}

		return () => {
			// Reset the widget ref on unmount so it can re-render next time
			widgetIdRef.current = null;
		};
	}, [renderWidget]);

	return (
		<div
			className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className='bg-background border border-border rounded-xl shadow-2xl p-6 flex flex-col items-center gap-5 animate-in zoom-in-95 duration-200'>
				<p className='text-sm font-medium text-foreground'>
					Please verify you are human
				</p>

				{/* reCAPTCHA widget renders here */}
				<div ref={containerRef} />

				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={onClose}
					className='w-full'
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
