import puppeteer, { PDFOptions } from 'puppeteer';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// supported extention names for images that are used in html source code to pdf
const filetypeMap: { [key: string]: string } = {
	png: 'image/png',
	jpg: 'image/jpg',
	svg: 'image/svg+xml',
};

const margin = 30;
export const pdfOutputPath = './src/public/transactions.pdf';

// default options for converting html to pdf
const defaultOptions: PDFOptions = {
	format: 'A4',
	printBackground: true,
	// path: pdfOutputPath,
	margin: {
		bottom: margin,
		top: margin,
		right: margin,
		left: margin,
	},
};

/**
 * replaces source of img tags so that puppeteer can load then into pdf
 * @param html
 * @returns
 */
const updateImgSrc = (html: string): string => {
	const $ = cheerio.load(html);

	$('img').each(function () {
		const original_src = $(this).attr('src');
		if (original_src === undefined) return;

		const file_extension = original_src.split('.').slice(-1)[0]; // extract file extension
		if (!filetypeMap[file_extension]) {
			console.log(`There is no mapping for file extension '${file_extension}'`);
			return;
		}

		const local_filename = path.join(
			__dirname,
			'../',
			'templates',
			'assets',
			original_src
		); // example for local path equalling src path
		// const local_filename = original_src.substring(3) // example for removing "../" from the beginning of the path
		if (!fs.existsSync(local_filename)) {
			console.log('File does not exist: ' + local_filename);
			return;
		}

		const local_src =
			'data:' +
			filetypeMap[file_extension] +
			';base64,' +
			fs.readFileSync(local_filename).toString('base64');
		$(this).attr('src', local_src);
	});

	return $.html();
};

/**
 * takes an html string and outputs a pdf of that given html to public folder
 * @param html source code
 * @param options optional
 */
export const convertToPdf = async (
	html: string,
	options: PDFOptions = defaultOptions
): Promise<Uint8Array<ArrayBufferLike>> => {
	const updatedHtml = updateImgSrc(html);

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const page = await browser.newPage();
	await page.emulateMediaType('print');
	await page.setContent(updatedHtml, { waitUntil: 'domcontentloaded' });
	const buffer = await page.pdf(options);
	await browser.close();

	return buffer;
};
