const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'src/components/buttons/EditAndDeleteButton.tsx',
    'src/components/buttons/EditAndDeleteCategoryButton.tsx',
    'src/components/buttons/EditAndDeleteOrganizationButton.tsx',
    'src/components/buttons/EditAndDeletePrelistingButton.tsx',
    'src/components/buttons/EditAndDeleteStudentButton.tsx',
    'src/components/buttons/EditAndDeleteTransactionButton.tsx',
    'src/components/forms/AddCategoryForm.tsx',
    'src/components/forms/AddOrganizationForm.tsx',
    'src/components/forms/AddPrelistingForm.tsx',
    'src/components/forms/AddRoleForm.tsx',
    'src/components/forms/AddStudentForm.tsx',
    'src/components/forms/AddTransactionForm.tsx',
    'src/components/forms/AddUserForm.tsx'
];

for (const file of filesToUpdate) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    let importsToAdd = [];
    if (content.includes("<Pencil") && !content.includes("Pencil")) importsToAdd.push("Pencil"); // wait, if it includes <Pencil it includes Pencil
    if (content.includes("<Pencil") && !content.includes("import {") && !content.match(/import.*Pencil.*from 'lucide-react'/)) importsToAdd.push("Pencil");
    
    const needsPencil = content.includes("<Pencil") && !content.match(/import.*Pencil.*from 'lucide-react'/);
    const needsTrash2 = content.includes("<Trash2") && !content.match(/import.*Trash2.*from 'lucide-react'/);
    
    if (needsPencil || needsTrash2) {
        let toAdd = [];
        if (needsPencil) toAdd.push("Pencil");
        if (needsTrash2) toAdd.push("Trash2");
        
        const lucideMatch = content.match(/import\s+{([^}]*)}\s+from\s+['"]lucide-react['"]/);
        if (lucideMatch) {
            const existing = lucideMatch[1];
            const updated = existing + ", " + toAdd.join(", ");
            content = content.replace(lucideMatch[0], `import {${updated}} from 'lucide-react'`);
        } else {
            content = `import { ${toAdd.join(", ")} } from 'lucide-react';\n` + content;
        }
        
        fs.writeFileSync(fullPath, content);
        console.log('Added imports to ' + fullPath);
    }
}
