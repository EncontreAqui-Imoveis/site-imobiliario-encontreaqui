import Link from 'next/link'

export default function SignupLegalNotice() {
    return (
        <p className="text-center text-sm text-slate-600 leading-relaxed">
            Ao continuar, você concorda com os{' '}
            <Link
                href="/termos-de-uso"
                className="font-semibold text-primary-600 hover:text-primary-700"
            >
                Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
                href="/politica-de-privacidade"
                className="font-semibold text-primary-600 hover:text-primary-700"
            >
                Política de Privacidade
            </Link>
            .
        </p>
    )
}
