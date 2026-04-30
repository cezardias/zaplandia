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
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white">
                <img 
                    src="/logo_zaplandia.png" 
                    alt="Zaplandia" 
                    className="w-full h-full object-cover scale-[4]" 
                />
            </div>
            <span className="absolute right-full mr-3 bg-white text-primary px-3 py-1.5 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
                Suporte Zaplândia
            </span>
        </motion.a>
    );
};

export default WhatsAppButton;
