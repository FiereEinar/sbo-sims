import multer from 'multer';

const storage = multer.memoryStorage();

// const storage = multer.diskStorage({
// 	destination: function (req, file, cb) {
// 		cb(null, path.join(__dirname, '../', 'public', 'uploads'));
// 	},
// 	filename: function (req, file, cb) {
// 		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
// 		cb(
// 			null,
// 			file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
// 		);
// 	},
// });

const upload = multer({ storage: storage });

export default upload;
