import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        // Prepare info for signed upload
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME
        const apiKey = process.env.CLOUDINARY_API_KEY
        const apiSecret = process.env.CLOUDINARY_API_SECRET

        if (!cloudName || !apiKey || !apiSecret) {
            return NextResponse.json({ error: 'Configuração de servidor incompleta' }, { status: 500 })
        }

        // We need to buffer the file to send it
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload using Cloudinary API directly via fetch to avoid installing 'cloudinary' sdk constraint if possible,
        // but SDK is easier. Since I can't easily install packages without permission and user didn't give explicit permission to add 'cloudinary' package,
        // I will try to use the unauthenticated 'upload_preset' strategy? NO, user gave me SECRET.

        // Strategy: Generate a signature manually requires crypto. 
        // EASIER: Just use the unsigned preset strategy? NO, user doesn't have one.
        // BEST: Use the package 'cloudinary' if installed OR manually build the multipart request to cloudinary with signature.

        // Actually, simplest is to just perform a signed upload via fetch.
        // Requires: timestamp, signature.

        const timestamp = Math.round((new Date()).getTime() / 1000)

        // Signature generation: Sort parameters by name, append secret, SHA1.
        // params: timestamp. (public_id etc are optional)
        const paramsToSign = `timestamp=${timestamp}${apiSecret}`

        // SHA1 using Web Crypto API or Node crypto
        const crypto = require('crypto')
        const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex')

        const uploadFormData = new FormData()
        uploadFormData.append('file', new Blob([buffer]), file.name)
        uploadFormData.append('api_key', apiKey)
        uploadFormData.append('timestamp', timestamp.toString())
        uploadFormData.append('signature', signature)

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
            method: 'POST',
            body: uploadFormData,
        })

        const data = await response.json()

        if (data.error) {
            throw new Error(data.error.message)
        }

        return NextResponse.json({ url: data.secure_url })

    } catch (error: any) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: error.message || 'Erro no upload' }, { status: 500 })
    }
}
