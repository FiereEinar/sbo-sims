import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
	test: {
		hookTimeout: 120000, // 2 minutes to allow MongoDB binary download
		testTimeout: 120000,
	},
});
