"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  MessageSquare,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(user => {
        if (user) {
          router.push('/memories');
        }
      })
      .catch(() => {
        // ignore errors
      });
  }, [router]);

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-orange-700 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                AI-Powered Memory Assistant
              </div>
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight sm:text-6xl md:text-7xl leading-tight">
                Never Forget
                <span className="block text-orange-500 mt-2">
                  Anything Again
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 sm:text-xl leading-relaxed">
                Your personal AI memory that lives in WhatsApp. Capture ideas,
                transcribe calls, and recall everything instantly—no app
                switching required.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:max-w-lg sm:mx-auto lg:mx-0 justify-center lg:justify-start">
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                  >
                    Start Remembering Everything
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 rounded-full border-2 w-full sm:w-auto"
                >
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white"
                    ></div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex gap-1 text-orange-500 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold">10,000+</span> memories saved
                </div>
              </div>
            </div>
            <div className="mt-16 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-gray-200">
                  <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600"></div>
                      <div>
                        <div className="text-white font-medium">Memora AI</div>
                        <div className="text-gray-400 text-sm">Online</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-800 rounded-2xl rounded-tl-sm p-4">
                        <p className="text-gray-300 text-sm">
                          💡 Remember: Call John about the Q4 proposal tomorrow
                          at 3pm
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-orange-600 rounded-2xl rounded-tr-sm p-4 max-w-[80%]">
                          <p className="text-white text-sm">
                            What was that idea about the mobile redesign?
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-800 rounded-2xl rounded-tl-sm p-4">
                        <p className="text-gray-300 text-sm">
                          ✨ Found it! You mentioned: "Bottom navigation with
                          haptic feedback and gesture controls"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to remember
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features that make Memora your second brain
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-3xl border border-orange-100 hover:shadow-xl transition-all">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-600 text-white mb-6">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                WhatsApp Native
              </h2>
              <p className="text-base text-gray-600 leading-relaxed">
                No new app to learn. Capture and recall directly in WhatsApp—the
                app you already use every day.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-3xl border border-orange-100 hover:shadow-xl transition-all">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-600 text-white mb-6">
                <Brain className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                AI Organization
              </h2>
              <p className="text-base text-gray-600 leading-relaxed">
                Smart AI automatically categorizes, tags, and connects your
                memories for instant contextual recall.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-3xl border border-orange-100 hover:shadow-xl transition-all">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-600 text-white mb-6">
                <Shield className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Private & Secure
              </h2>
              <p className="text-base text-gray-600 leading-relaxed">
                End-to-end encryption. Your memories belong to you, stored
                securely and never shared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Memora works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to never forget again
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 -translate-y-1/2 -z-0"></div>

            <div className="relative bg-white p-8 rounded-3xl border-2 border-orange-100 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 text-white text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Capture</h3>
              <p className="text-gray-600 leading-relaxed">
                Send a message, voice note, or forward anything to Memora in
                WhatsApp
              </p>
            </div>

            <div className="relative bg-white p-8 rounded-3xl border-2 border-orange-100 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 text-white text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                AI Process
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI transcribes, categorizes, and connects your memory
                automatically
              </p>
            </div>

            <div className="relative bg-white p-8 rounded-3xl border-2 border-orange-100 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 text-white text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Recall</h3>
              <p className="text-gray-600 leading-relaxed">
                Ask Memora anything and get instant, contextual answers from
                your memories
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Memora?
            </h2>
            <p className="text-xl text-gray-600">
              Stop juggling apps. Start remembering everything.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-400 mb-6">
                Traditional Notes Apps
              </h3>
              <ul className="space-y-4">
                {[
                  "Manual organization required",
                  "No voice transcription",
                  "Can't recall by context",
                  "Another app to check",
                  "No AI assistance",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gray-500 text-sm">✕</span>
                    </div>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-3xl border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                BEST CHOICE
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Memora</h3>
              <ul className="space-y-4">
                {[
                  "AI auto-organizes everything",
                  "Voice & call transcription",
                  "Contextual AI recall",
                  "Lives in WhatsApp",
                  "Always learning about you",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-900 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by knowledge workers
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands who never forget
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: "Memora changed how I work. I capture ideas on the go and they're always there when I need them. Game changer.",
                author: "Sarah Chen",
                role: "Product Designer",
                avatar: "from-purple-400 to-purple-600",
              },
              {
                text: "I used to lose brilliant ideas. Now they're all in WhatsApp with Memora. It's like having a second brain.",
                author: "Marcus Rodriguez",
                role: "Startup Founder",
                avatar: "from-blue-400 to-blue-600",
              },
              {
                text: "The voice transcription is incredible. I record thoughts while driving and Memora makes them searchable instantly.",
                author: "Priya Patel",
                role: "Content Creator",
                avatar: "from-green-400 to-green-600",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.author}
                className="bg-white p-8 rounded-3xl border border-gray-200 hover:shadow-xl transition-all"
              >
                <div className="flex gap-1 text-orange-500 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.avatar}`}
                  ></div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you're ready
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-3xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900">$0</div>
                <div className="text-gray-500 mt-2">Forever free</div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "100 memories/month",
                  "Text capture",
                  "Basic search",
                  "WhatsApp integration",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full rounded-full" variant="outline">
                Start Free
              </Button>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-3xl border-2 border-orange-600 relative transform md:scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-orange-600 text-sm font-bold px-4 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="text-4xl font-bold text-white">$12</div>
                <div className="text-orange-100 mt-2">per month</div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited memories",
                  "Voice transcription",
                  "Call recording",
                  "AI search & insights",
                  "Priority support",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full rounded-full bg-white text-orange-600 hover:bg-orange-50">
                Start Pro Trial
              </Button>
            </div>

            <div className="bg-white p-8 rounded-3xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Team</h3>
                <div className="text-4xl font-bold text-gray-900">$29</div>
                <div className="text-gray-500 mt-2">per user/month</div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Everything in Pro",
                  "Shared team memories",
                  "Admin controls",
                  "Team analytics",
                  "Dedicated support",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full rounded-full bg-orange-600 text-white hover:bg-orange-700">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "How does Memora work with WhatsApp?",
                a: "Memora integrates directly with WhatsApp. You simply chat with Memora like any other contact. Send text, voice notes, or forward messages, and Memora captures everything.",
              },
              {
                q: "Is my data private and secure?",
                a: "Absolutely. All your data is encrypted end-to-end. We never share or sell your information. You own your memories, and only you can access them.",
              },
              {
                q: "Can I export my memories?",
                a: "Yes! You can export all your memories anytime in multiple formats (JSON, CSV, PDF). Your data is always yours.",
              },
              {
                q: "Does it work offline?",
                a: "Memora needs internet to process and store memories. However, once captured, you can search and recall memories even with slow connections.",
              },
              {
                q: "How accurate is the voice transcription?",
                a: "Our AI achieves 95%+ accuracy for clear audio in 50+ languages. It handles accents, background noise, and technical terminology.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to remember everything?
          </h2>
          <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
            Join thousands who never forget. Start capturing your best ideas
            today—free forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-in">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-orange-100 text-sm mt-6">
            No credit card required • 2-minute setup • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white transition-colors">
                    Licenses
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600"></div>
              <span className="text-xl font-bold text-white">Memora</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 Memora. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="text-white transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-white transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
