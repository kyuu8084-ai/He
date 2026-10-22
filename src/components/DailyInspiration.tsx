import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Quote } from 'lucide-react';

const QUOTES = [
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack", vi: "Tập trung là quyết định những việc bạn sẽ không làm." },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", vi: "Chiến binh thành công là người bình thường, với sự tập trung như tia laser." },
  { text: "You can do anything, but not everything.", author: "David Allen", vi: "Bạn có thể làm bất cứ điều gì, nhưng không phải tất cả mọi thứ." },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", vi: "Sự đơn giản là đỉnh cao của sự tinh tế." },
  { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell", vi: "Hãy tập trung mọi suy nghĩ vào công việc đang làm. Tia nắng mặt trời không thể đốt cháy cho đến khi được hội tụ." },
  { text: "What you choose to focus on becomes your reality.", author: "Jen Sincero", vi: "Những gì bạn chọn để tập trung vào sẽ trở thành hiện thực của bạn." },
  { text: "The direction of your focus is the direction your life will move.", author: "Ralph Marston", vi: "Hướng đi của sự tập trung cũng chính là hướng đi của cuộc đời bạn." },
  { text: "Do it now. Sometimes 'later' becomes 'never'.", author: "Anonymous", vi: "Hãy làm ngay bây giờ. Đôi khi 'sau này' sẽ trở thành 'không bao giờ'." },
  { text: "Great things are not done by impulse, but by a series of small things brought together.", author: "Vincent van Gogh", vi: "Những điều lớn lao không được thực hiện bởi sự bốc đồng, mà bởi một chuỗi những điều nhỏ bé được kết hợp lại." },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein", vi: "Không phải vì tôi quá thông minh, chỉ là tôi kiên trì với vấn đề lâu hơn." }
];

export default function DailyInspiration({ language = 'en', isDarkMode = false }: { language?: 'en' | 'vi', isDarkMode?: boolean }) {
  const [quote, setQuote] = useState(QUOTES[0]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const today = new Date();
    // Use the date to pick a consistent quote for the day
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    setQuote(QUOTES[dayOfYear % QUOTES.length]);
    
    // Slight delay for animation
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const textColor = isDarkMode ? 'text-[#182C41]' : 'text-white';
  const borderColor = isDarkMode ? 'border-[#182C41]/20' : 'border-white/20';
  const bgColor = isDarkMode ? 'bg-[#182C41]/5' : 'bg-white/5';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={`flex flex-col items-center max-w-md mx-auto mt-12 mb-4 px-6 py-4 rounded-3xl ${bgColor} ${borderColor} border backdrop-blur-md`}
        >
          <div className="flex items-center gap-2 mb-2 opacity-60">
            <Sparkles size={14} className={textColor} />
            <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${textColor}`}>
              {language === 'vi' ? 'Cảm hứng trong ngày' : 'Daily Inspiration'}
            </span>
          </div>
          
          <div className="relative">
            <Quote size={24} className={`absolute -top-3 -left-4 opacity-10 ${textColor}`} />
            <p className={`text-sm sm:text-base italic font-serif text-center leading-relaxed ${textColor} opacity-90`}>
              {language === 'vi' ? quote.vi : quote.text}
            </p>
          </div>
          <p className={`text-xs mt-3 opacity-60 font-medium ${textColor}`}>— {quote.author}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
