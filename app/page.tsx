'use client';

import React from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import Image from 'next/image';

const features = [
  {
    title: 'Real-Time Market Data',
    description: 'Get instant access to live market data across stocks, indices, commodities, and cryptocurrencies.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title: 'Advanced Analytics',
    description: 'Access powerful technical analysis tools and advanced charting capabilities.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Portfolio Tracking',
    description: 'Track your investments and monitor your portfolio performance in real-time.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const pricingPlans = [
  {
    name: 'Basic',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      'Real-time market data',
      'Basic charts',
      'Limited market analysis',
      'Portfolio tracking (up to 5 assets)',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Best for active traders',
    features: [
      'Everything in Basic',
      'Advanced technical analysis',
      'Real-time alerts',
      'Unlimited portfolio tracking',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For professional traders',
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Team collaboration',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-blue-400 dark:to-blue-600">
                Track Your Investments with Confidence
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Monitor your portfolio, analyze market trends, and make informed investment decisions with our comprehensive trading platform.
              </p>
              <div className="flex gap-4">
                <Link href="/auth/signin">
                  <button className="px-6 py-3 bg-emerald-600 dark:bg-blue-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-blue-600 transition-colors duration-300">
                    Get Started
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300">
                    View Demo
                  </button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative w-full h-[400px] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-colors duration-300">
                <Image
                  src="/chart-placeholder.svg"
                  alt="Sample Trading Chart"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Powerful Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Everything you need to make informed investment decisions
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-emerald-600 dark:text-blue-400 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the plan that's right for you
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`
                  relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300
                  ${plan.highlighted 
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 dark:from-blue-600 dark:to-blue-700 transform scale-105 hover:shadow-xl' 
                    : 'bg-white dark:bg-gray-800 hover:shadow-lg border border-gray-100 dark:border-gray-700'
                  }
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-8 h-full flex flex-col">
                  <div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      plan.highlighted ? 'text-white' : 'text-gray-800 dark:text-white'
                    }`}>
                      {plan.name}
                    </h3>
                    <div className="mb-6">
                      <span className={`text-4xl font-bold ${
                        plan.highlighted ? 'text-white' : 'text-gray-800 dark:text-white'
                      }`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={`text-lg ${
                          plan.highlighted ? 'text-emerald-100 dark:text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className={`mb-6 ${
                      plan.highlighted ? 'text-emerald-100 dark:text-blue-100' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {plan.description}
                    </p>
                    <ul className="mb-8 space-y-4">
                      {plan.features.map((feature) => (
                        <li 
                          key={feature}
                          className={`flex items-center ${
                            plan.highlighted ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <svg 
                            className={`w-5 h-5 mr-2 flex-shrink-0 ${
                              plan.highlighted 
                                ? 'text-emerald-200 dark:text-blue-200' 
                                : 'text-emerald-500 dark:text-blue-400'
                            }`}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-auto">
                    <button
                      className={`
                        w-full py-3 px-6 rounded-lg font-medium transition-all duration-300
                        ${plan.highlighted
                          ? 'bg-white text-emerald-600 dark:text-blue-600 hover:bg-gray-50 shadow-md hover:shadow-lg'
                          : 'bg-emerald-600 dark:bg-blue-600 text-white hover:bg-emerald-700 dark:hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }
                      `}
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
