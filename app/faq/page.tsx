'use client';

import { useState } from 'react';

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  //-------------------------
  // FAQ Items and Answers
  //-------------------------

  const faqItems = [
    {
      question: "How do I use Yonder Points Optimiser?",
      answer: "Simply select your card type from the dropdown in the top right, then browse through the different categories to find the best redemption rates. We'll show you the value per 1,000 points and the effective return rate to help you make the best choice."
    },
    {
      question: "What's the difference between the card types?",
      answer: "Different Yonder card types earn points at different rates: Free cards earn 1 point per £1 spent, while Paid cards earn 4-5 points per £1. This affects your effective return rate when redeeming points for experiences."
    },
    {
      question: "What are the Top 3 Redemptions?",
      answer: "They're the Experiences that offer the best value for your points across all categories. We calculate this every month."
    },
    {
      question: "What do the Great Value and Bad Deal badges mean ?",
      answer: "Great Value badges highlight experiences that offer excellent value for your points, while Bad Deal badges point out those that may not be worth the points required. These badges are calculated based on redemption rates and thresholds we set."
    },
    {
      question: "Will this cost me anything?",
      answer: ["Nothing, nada, nichts - it's all free. This tool is to help you get the most out of your Yonder points.", 
                "If you find it useful, share it with your friends that have a Yonder card!"
      ]
    },
    {
      question: "Who's behind this?",
      answer: "A happy Yonder user who wanted to make the most of their points. If you have any feedback or suggestions, feel free to reach out!"
    },
  ];

//-------------------------
// Render the FAQ page
//-------------------------

  return (
    <div style={{ backgroundColor: '#fef7f0' }} className="min-h-screen">
      {/* Header */}
      <div className="hero-gradient-background relative -mx-4 sm:-mx-6 lg:-mx-8 mb-16" style={{ paddingBottom: '8rem' }}>
          <div className="border-b border-orange-200/30 px-4 sm:px-6 lg:px-8">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center max-w-6xl mx-auto">
                <a 
                href="/"
                className="text-sm font-medium px-4 py-2 rounded-full hover:bg-orange-100 transition-colors"
                style={{ color: 'var(--foreground)' }}
                >
                ← Home
                </a>
                
                <h1 className="text-2xl sm:text-4xl font-bold text-center" style={{ color: 'var(--foreground)' }}>
                Yonder Points Optimiser
                </h1>
                
                <div className="w-16"></div> {/* Spacer for centering */}
            </div>
            </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-24">
        <div className="text-center justify-center mb-8">
            <h1 className="text-5xl font-serif font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Frequently Asked Questions
            </h1>
          <p className="text-xl text-center" >
            If you can't find the answer that you're looking for, feel free to send us a message.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-2xl overflow-hidden transition-all duration-200" style={{ backgroundColor: "#ffe5cc" }}
            >
              <button
                onClick={() => toggleExpanded(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-200 transition-colors"
              >
                <h3 className="text-lg font-semibold" style={{ color: 'var(--yonder-navy)' }}>
                  {item.question}
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    expandedItems.has(index) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 8l4 4 4-4"
                  />
                </svg>
              </button>
              
              {expandedItems.has(index) && (
                <div className="px-6 pt-4 pb-4" style={{ backgroundColor: '#fef7f0', borderColor: '#ffe5cc', borderWidth: 2, borderTopWidth: 0, borderRadius: '0 0 1rem 1rem' }}>
                   {Array.isArray(item.answer) ? (
                        item.answer.map((paragraph, i) => (
                            <p key={i} className="leading-relaxed last:mb-0" style={{ color: 'var(--yonder-navy)' }}>
                                {paragraph}
                            </p>
                        ))
                     ) : (
                            <p className="leading-relaxed" style={{ color: 'var(--yonder-navy)' }}>
                                {item.answer}
                            </p>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="text-center mt-8 p-6">
          <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
            Still have questions?
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 text-white rounded-full transition-colors font-medium" style={{ backgroundColor: 'var(--yonder-orange)' }}>
              Send us a message
            </button>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-16 pt-8 border-t border-gray-300">
          <p className="text-center text-sm text-gray-600 max-w-6xl mx-auto leading-relaxed">
            Made with ❤️ for the Yonder community.
            <br />
            <br />
            This is an unofficial, third-party tool not affiliated with or endorsed by Yonder Technology Ltd. 
            All Yonder trademarks and service marks belong to Yonder Technology Ltd. 
            This tool is provided for informational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}