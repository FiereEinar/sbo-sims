const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            const hasEdit = content.includes("icons/edit.svg");
            const hasDelete = content.includes("icons/delete.svg");

            if (hasEdit || hasDelete) {
                content = content.replace(/<img[^>]*src=['"]\/icons\/edit\.svg['"][^>]*\/>/g, "<Pencil className='size-4' />");
                content = content.replace(/<img[^>]*src=['"]\/icons\/delete\.svg['"][^>]*\/>/g, "<Trash2 className='size-4' />");
                content = content.replace(/variant=['"]ocean['"]/g, "variant='outline'");
                
                const importsToAdd = [];
                if (hasEdit && !content.match(/\bPencil\b/)) importsToAdd.push("Pencil");
                if (hasDelete && !content.match(/\bTrash2\b/)) importsToAdd.push("Trash2");

                if (importsToAdd.length > 0) {
                    const lucideMatch = content.match(/import\s+{([^}]*)}\s+from\s+['"]lucide-react['"]/);
                    if (lucideMatch) {
                        const existing = lucideMatch[1];
                        const updated = existing + ", " + importsToAdd.join(", ");
                        content = content.replace(lucideMatch[0], `import {${updated}} from 'lucide-react'`);
                    } else {
                        content = `import { ${importsToAdd.join(", ")} } from 'lucide-react';\n` + content;
                    }
                }
                
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated: ' + fullPath);
            }
        }
    }
}

processDir('./src/components');
