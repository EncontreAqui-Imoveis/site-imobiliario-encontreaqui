import type { SignupDraft } from '@/lib/authSignupDraft'
import { clearSignupDraft } from '@/lib/authSignupDraft'
import { persistAuthToken } from '@/lib/auth/tokenStore'
import { finalizeSignupDraft } from '@/lib/api/signupDraft'
import { mapAuthResponseToSession, type UserSession } from '@/lib/api/auth'


/**
 * Cria a conta a partir do rascunho (e-mail ou telefone já validados no fluxo).
 * Limpa o rascunho após sucesso.
 */
export async function registerUserFromSignupDraft(draft: SignupDraft): Promise<UserSession> {
    if (!draft.userType) {
        throw new Error('Tipo de perfil ausente no rascunho.')
    }
    if (!draft.draftId || !draft.draftToken) {
        throw new Error('Draft incompleto para consolidação.')
    }

    const action = draft.userType === 'broker' ? 'broker_submit_documents' : 'client_finalize'
    const finalize = await finalizeSignupDraft(draft.draftId, draft.draftToken, action)

    if (finalize.token) {
        persistAuthToken(finalize.token)
    }

    clearSignupDraft()
    return mapAuthResponseToSession({
        user: finalize.user as unknown as UserSession['user'],
        token: finalize.token,
        needsCompletion: finalize.needsCompletion,
        requiresDocuments: finalize.requiresDocuments,
    })
}
