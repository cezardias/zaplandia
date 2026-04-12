'use client';

import React from 'react';
import { ShieldCheck, FileText, Lock, Globe } from 'lucide-react';

export default function GovernancePage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8 flex items-center space-x-4">
                <div className="p-3 bg-primary/20 rounded-2xl">
                    <ShieldCheck className="w-8 h-8 text-primary shadow-sm" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Transparency & Governance</h1>
                    <p className="text-gray-400">Meta App Review Compliance Documentation</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                    <Lock className="w-6 h-6 text-primary mb-3" />
                    <h3 className="font-bold text-sm mb-1">Data Privacy</h3>
                    <p className="text-xs text-gray-500">GDPR & LGPD Compliant policies for all tenants.</p>
                </div>
                <div className="bg-surface p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                    <ShieldCheck className="w-6 h-6 text-green-500 mb-3" />
                    <h3 className="font-bold text-sm mb-1">Authorized Access</h3>
                    <p className="text-xs text-gray-500">Explicit user consent required for API operations.</p>
                </div>
                <div className="bg-surface p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                    <Globe className="w-6 h-6 text-blue-500 mb-3" />
                    <h3 className="font-bold text-sm mb-1">Official Integration</h3>
                    <p className="text-xs text-gray-500">Verified WhatsApp Business Solution integration.</p>
                </div>
            </div>

            <div className="bg-surface p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <FileText className="w-32 h-32" />
                </div>

                <div className="relative z-10 space-y-6 text-gray-300 leading-relaxed font-light">
                    <p className="font-medium text-white mb-8">Dear App Review Team,</p>
                    
                    <p>
                        I am writing to request permission for our application, <strong>Zaplândia</strong>, to access the WhatsApp Business API, specifically the <strong>whatsapp_business_management</strong> and <strong>whatsapp_business_messaging</strong> permissions. 
                    </p>

                    <p>
                        Our platform is designed to help businesses manage their customer service and sales operations, and we believe that integrating with WhatsApp Business API would greatly enhance our platform's functionality and benefit our users. 
                    </p>

                    <p>
                        The <strong>whatsapp_business_management</strong> permission would allow us to read and manage WhatsApp business assets that our users own or have been granted access to. This includes WhatsApp Business Accounts, phone numbers, message templates, QR codes, and webhook subscriptions. By accessing these assets, we can provide a centralized platform for businesses to manage their customer interactions and support requests, as well as send marketing messages and promotional content to their customers.
                    </p>

                    <p>
                        Our app's primary use case is to enable businesses to communicate with their customers in a timely and efficient manner. With these permissions, we can offer our users a seamless experience in managing their WhatsApp business accounts and customer interactions. This permission would also allow us to provide businesses with valuable insights and analytics on their customer engagement and sales performance.
                    </p>

                    <p>
                        We understand the importance of privacy and security, and we assure you that we will only use this permission to access the business assets of our users who have explicitly granted us permission to do so. We have strict data protection policies in place to ensure that all customer data is kept confidential and secure.
                    </p>

                    <div className="pt-8 border-t border-white/5">
                        <p>Thank you for considering our request. We believe that integrating with WhatsApp Business API would greatly enhance our platform's functionality and benefit our users. We look forward to the opportunity to work with you.</p>
                        
                        <div className="mt-8">
                            <p className="font-bold text-white">Sincerely,</p>
                            <p className="text-primary italic">Zaplândia Platform Team</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <footer className="mt-8 text-center text-xs text-gray-600">
                &copy; {new Date().getFullYear()} Zaplândia. All Rights Reserved. Official Meta Tech Provider Integration.
            </footer>
        </div>
    );
}
