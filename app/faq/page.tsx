'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    {
      question: "Can I support this in any way?",
      answer: ["This tool is free to use and will always be. If you've shared it and want to help keep the lights on, feel free to buy me a coffee at the link below. It helps cover hosting costs. Thanks for your your support!",
        <Link 
        key = "buy-coffee-link"
        href="https://www.buymeacoffee.com/yonderpointsoptimiser"
        >
        <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=yonderpointsoptimiser&button_colour=f28f44&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00" />
        </Link>
      ]
    },
  ];

  //-------------------------
  // Render the FAQ page
  //-------------------------

  return (
    <div className="full-page-gradient">
      {/* Sticky Header */}
      <div className="top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link 
                href="/"
                className="text-sm font-medium px-4 py-2 rounded-full hover:bg-orange-100 transition-colors"
                style={{ color: 'var(--foreground)' }}
              >
                Home
              </Link>
            </div>
            
            {/* Center - Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl sm:text-4xl font-bold text-center" style={{ color: 'var(--foreground)' }}>
                Yonder Points Optimiser
              </h1>
            </div>
            
            <div className="hidden sm:inline-flex items-center bg-transparent border-2 border-transparent rounded-full px-3 py-2" style={{ width: '200px' }}>
                {/* Invisible spacer that matches card selector width */}
            </div>
            {/* Right side - Empty spacer */}
            <div className="sm:hidden w-16"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8"> 
        {/* Hero Section with Gradient */}
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-4" style={{ paddingBottom: '8rem' }}>
          <div className="px-4 sm:px-6 lg:px-8 py-8 text-center justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold max-w-4xl mx-auto" style={{ color: 'var(--foreground)' }}>
              Frequently Asked Questions
            </h1>
            <p className="p-2 text-xl md-text-3xl mt-4 max-w-3xl mx-auto" style={{ color: 'var(--yonder-navy)', opacity: 0.8 }}>
              If you can&apos;t find the answer that you&apos;re looking for, feel free to send us a message.
            </p>
          </div>
        </div>

        {/* FAQ Content - Overlapping */}
        <div className="max-w-4xl mx-auto -mt-36 relative z-10">
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-2xl overflow-hidden transition-all duration-200" 
                style={{ backgroundColor: "#ffe5cc" }}
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
                  <div className="px-6 pt-4 pb-4" style={{ 
                    backgroundColor: '#fef7f0', 
                    borderColor: '#ffe5cc', 
                    borderWidth: 2, 
                    borderTopWidth: 0, 
                    borderRadius: '0 0 1rem 1rem' 
                  }}>
                     {Array.isArray(item.answer) ? (
                          item.answer.map((paragraph, i) => (
                              <p key={i} className="leading-relaxed mb-3 last:mb-0" style={{ color: 'var(--yonder-navy)' }}>
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
          <div className="text-center col-2 mt-8 p-6">
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Still have questions?
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 text-white rounded-full transition-colors font-medium" style={{ backgroundColor: 'var(--yonder-orange)' }}>
                Send us a message
              </button>
{/* 
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                Want to support this project?
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="https://www.buymeacoffee.com/yonderpointsoptimiser"
                  className="px-6 py-3 text-white rounded-full transition-colors font-medium"
                  style={{ backgroundColor: 'var(--yonder-orange)' }}
                >
                  Buy me a coffee
                </Link> */}
          </div>
            </div>
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


  );
}