const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
	fs.readdirSync(dir).forEach(f => {
		let dirPath = path.join(dir, f);
		let isDirectory = fs.statSync(dirPath).isDirectory();
		isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
	});
}

walkDir(path.join(__dirname, 'client/src'), function(filePath) {
	if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    // skip our hook itself and ProtectedRoute, Route, RootRedirect
    if (filePath.includes('useTenantNavigate.ts')) return;
    if (filePath.includes('ProtectedRoute.tsx')) return;
    if (filePath.includes('Route.tsx')) return;
    if (filePath.includes('RootRedirect.tsx')) return;
    if (filePath.includes('App.tsx')) return; // handled via navigate inside?

	let content = fs.readFileSync(filePath, 'utf8');
	let changed = false;

	if (content.includes('useNavigate')) {
		// Replace import { useNavigate } from 'react-router-dom'
        // Need to be careful: sometimes it's imported with others: import { Link, useNavigate } from 'react-router-dom'
        
        // 1. Add import for useTenantNavigate
        if (!content.includes('useTenantNavigate')) {
            // Find relative path to hooks/useTenantNavigate
            const srcDir = path.join(__dirname, 'client/src');
            const fileDir = path.dirname(filePath);
            let relPath = path.relative(fileDir, path.join(srcDir, 'hooks/useTenantNavigate')).replace(/\\/g, '/');
            if (!relPath.startsWith('.')) relPath = './' + relPath;
            
            content = `import { useTenantNavigate } from '${relPath}';\n` + content;
            changed = true;
        }

        // 2. Replace const navigate = useNavigate()
        if (content.match(/const navigate = useNavigate\(\);?/)) {
            content = content.replace(/const navigate = useNavigate\(\);?/, 'const navigate = useTenantNavigate();');
            changed = true;
        }

        // 3. Remove useNavigate from react-router-dom import if it becomes unused
        // actually easier to just let eslint fix or leave it.

		if (changed) {
			fs.writeFileSync(filePath, content);
			console.log('Updated', filePath);
		}
	}
});
