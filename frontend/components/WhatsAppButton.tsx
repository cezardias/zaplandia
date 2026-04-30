'use client';

import React from 'react';
import { motion } from 'framer-motion';

const WhatsAppButton = () => {
    const phoneNumber = '556193754617';
    const message = 'Olá! Gostaria de saber mais sobre o Zaplandia.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-32 right-6 z-[9999] text-white p-4 rounded-full shadow-2xl flex items-center justify-center group"
            style={{ backgroundColor: '#ef4444' }}
            title="Fale conosco no WhatsApp"
        >
            <div className="relative flex items-center justify-center w-8 h-8">
                <svg
                    viewBox="0 0 24 24"
                    className="w-full h-full fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.35 2.99 0.97 4.29L2 22l5.71-0.97C9.01 21.65 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#ef4444] mb-[1px]">Z</span>
            </div>
            <span className="absolute right-full mr-3 bg-white text-gray-800 px-3 py-1.5 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Suporte Zaplândia
            </span>
        </motion.a>
    );
};

export default WhatsAppButton;
