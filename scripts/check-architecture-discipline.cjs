/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

function walk(dir, results = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === '.next') {
            continue
        }

        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(fullPath, results)
            continue
        }

        if (/\.(ts|tsx)$/.test(entry.name)) {
            results.push(fullPath)
        }
    }

    return results
}

function relative(file) {
    return path.relative(ROOT, file).replace(/\\/g, '/')
}

function getImports(source) {
    const imports = []
    const importRegex = /^import(\s+type)?[\s\S]*?from\s+['"]([^'"]+)['"]/gm
    let match
    while ((match = importRegex.exec(source)) !== null) {
        imports.push({
            typeOnly: Boolean(match[1]),
            target: match[2],
        })
    }
    return imports
}

function isPage(file) {
    return /src\/app\/.+\/page\.tsx$/.test(file)
}

function isPureVisualComponent(file) {
    return (
        file.startsWith('src/components/') &&
        !file.startsWith('src/components/contracts/')
    )
}

const files = walk(SRC).map((file) => ({
    abs: file,
    rel: relative(file),
    content: fs.readFileSync(file, 'utf8'),
}))

const hardViolations = []
const consultiveAlerts = []

for (const file of files) {
    const imports = getImports(file.content)
    const runtimeImports = imports.filter((item) => !item.typeOnly)

    if (isPureVisualComponent(file.rel)) {
        for (const item of runtimeImports) {
            if (item.target === '@/lib/api/client') {
                hardViolations.push(
                    `${file.rel}: componente visual nao deve importar api client direto (${item.target})`,
                )
            }
            if (item.target === '@/lib/firebase' || item.target === 'firebase/auth') {
                hardViolations.push(
                    `${file.rel}: componente visual nao deve importar firebase direto (${item.target})`,
                )
            }
        }
    }

    if (isPage(file.rel)) {
        for (const item of runtimeImports) {
            if (item.target === '@/lib/firebase' || item.target === 'firebase/auth') {
                hardViolations.push(
                    `${file.rel}: page nao deve importar firebase direto (${item.target})`,
                )
            }
            if (item.target === '@/lib/api/client') {
                hardViolations.push(
                    `${file.rel}: page nao deve importar apiClient direto (${item.target})`,
                )
            }
        }
    }

    const fanOut = new Set(runtimeImports.map((item) => item.target)).size
    if (fanOut >= 10) {
        consultiveAlerts.push(`${file.rel}: fan-out alto (${fanOut} imports runtime)`)
    }
}

console.log('Disciplina arquitetural (site-imobiliario) - fronteiras duras')
if (hardViolations.length === 0) {
    console.log('  Nenhuma violacao dura encontrada.')
} else {
    for (const violation of hardViolations) {
        console.log(`  - ${violation}`)
    }
}

console.log('\nDisciplina arquitetural (site-imobiliario) - alertas consultivos')
if (consultiveAlerts.length === 0) {
    console.log('  Nenhum alerta consultivo encontrado.')
} else {
    for (const alert of consultiveAlerts) {
        console.log(`  - ${alert}`)
    }
}

if (hardViolations.length > 0) {
    process.exit(1)
}
