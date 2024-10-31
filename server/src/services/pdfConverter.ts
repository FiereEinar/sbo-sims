import puppeteer, { PDFOptions } from 'puppeteer';

export const pdfOutputPath = './src/public/transactions.pdf';

const defaultOptions: PDFOptions = {
	format: 'A4',
	printBackground: true,
	path: pdfOutputPath,
};

export const convertToPdf = async (
	html: string,
	options: PDFOptions = defaultOptions
): Promise<void> => {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.setContent(html, { waitUntil: 'domcontentloaded' });

	await page.pdf(options);

	await browser.close();
};
