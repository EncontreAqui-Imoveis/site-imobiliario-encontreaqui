import { redirect } from 'next/navigation'

export default async function NovaPropostaPage({
    params,
}: {
    params: Promise<{ propertyId: string }>
}) {
    const { propertyId } = await params
    redirect(`/propostas/nova?propertyId=${encodeURIComponent(propertyId)}`)
}
