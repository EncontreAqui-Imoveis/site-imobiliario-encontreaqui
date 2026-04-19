/** Primeira letra visível em maiúscula (ex.: título API em minúsculas). */
export function capitalizePropertyTitle(title: string): string {
    const t = title.trim()
    if (!t) return title
    const i = t.search(/\S/)
    if (i === -1) return title
    return t.slice(0, i) + t.charAt(i).toLocaleUpperCase('pt-BR') + t.slice(i + 1)
}
