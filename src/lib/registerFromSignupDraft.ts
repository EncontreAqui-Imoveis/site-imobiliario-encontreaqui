import { register, type UserSession } from '@/lib/api/auth'
import type { SignupDraft } from '@/lib/authSignupDraft'
import { clearSignupDraft } from '@/lib/authSignupDraft'
import { normalizePhoneDigits } from '@/lib/phoneInput'

/**
 * Cria a conta a partir do rascunho (e-mail ou telefone já validados no fluxo).
 * Limpa o rascunho após sucesso.
 */
export async function registerUserFromSignupDraft(draft: SignupDraft): Promise<UserSession> {
    if (!draft.userType) {
        throw new Error('Tipo de perfil ausente no rascunho.')
    }
    const normalizedPhone = normalizePhoneDigits(draft.data.phone)
    const signupProfileType = draft.userType === 'broker' ? 'broker' : 'client'

    const result = await register({
        name: draft.data.name.trim(),
        email: draft.data.email.trim().toLowerCase(),
        password: draft.data.password,
        profileType: signupProfileType,
        creci: signupProfileType === 'broker' ? draft.data.creci.trim().toUpperCase() : undefined,
        googleIdToken: draft.source === 'google' ? draft.data.googleIdToken : undefined,
        phone: normalizedPhone || undefined,
        cep: draft.data.cep.replace(/\D/g, '') || undefined,
        street: draft.data.street.trim() || undefined,
        number: draft.data.number.trim() || undefined,
        withoutNumber: draft.data.semNumero ? true : undefined,
        complement: draft.data.complement.trim() || undefined,
        bairro: draft.data.bairro.trim() || undefined,
        city: draft.data.city.trim() || undefined,
        state: draft.data.state.trim().toUpperCase() || undefined,
    })

    clearSignupDraft()
    return result
}
