'use client'

import { useState } from 'react'
import { Phone, Mail, MapPin, Send, MessageCircle } from 'lucide-react'

export default function ContactPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000))

        setSuccess(true)
        setIsLoading(false)
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 lg:pt-20">
            {/* Header */}
            <section className="gradient-hero py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Entre em Contato
                    </h1>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto">
                        Estamos prontos para ajudar você. Entre em contato conosco por qualquer um dos canais abaixo.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* WhatsApp Card */}
                        <a
                            href="https://wa.me/5564993012696"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-green-600 hover:bg-green-700 text-white rounded-2xl p-6 transition-all shadow-lg hover:shadow-xl"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-semibold text-lg">WhatsApp</div>
                                    <div className="text-white/80">(64) 99301-2696</div>
                                </div>
                            </div>
                        </a>

                        {/* Phone Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                    <Phone className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Telefone</div>
                                    <a href="tel:+5564993012696" className="text-gray-600 hover:text-primary-600">
                                        (64) 99301-2696
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Email Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Email</div>
                                    <a href="mailto:contato@maisimoveis.com" className="text-gray-600 hover:text-primary-600">
                                        contato@maisimoveis.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Localização</div>
                                    <div className="text-gray-600">Rio Verde, GO</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Envie uma mensagem
                            </h2>

                            {success ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Mensagem enviada!
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Obrigado pelo contato. Retornaremos em breve.
                                    </p>
                                    <button
                                        onClick={() => setSuccess(false)}
                                        className="text-primary-600 font-medium hover:text-primary-700"
                                    >
                                        Enviar outra mensagem
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Nome
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="Seu nome"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                required
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="seu@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Telefone
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="(64) 99999-9999"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Assunto
                                            </label>
                                            <select
                                                value={formData.subject}
                                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                                required
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="compra">Quero comprar um imóvel</option>
                                                <option value="venda">Quero vender um imóvel</option>
                                                <option value="aluguel">Quero alugar um imóvel</option>
                                                <option value="duvida">Tenho uma dúvida</option>
                                                <option value="outro">Outro assunto</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Mensagem
                                        </label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                            required
                                            rows={5}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                            placeholder="Como podemos ajudar?"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl shadow-lg transition-all"
                                    >
                                        {isLoading ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Enviar mensagem
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
