import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Never Forget a Thing{" "}
                <span className="block text-orange-500">Extended Memory</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                In a world overflowing with information, your mind deserves a
                break. Memora is your personal AI companion that captures,
                remembers, and instantly recalls everything you need—right in
                WhatsApp.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <a
                  href="https://vercel.com/templates/next.js/next-js-saas-starter"
                  target="_blank"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg rounded-full"
                  >
                    Deploy your own
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center justify-center">
              <Image
                src="/hero-img.jpg"
                alt="Memora Hero"
                width={400}
                height={400}
                className="w-full max-w-md rounded-xl shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* WhatsApp-First Experience */}
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                {/* WhatsApp icon */}
                <svg viewBox="0 0 32 32" className="h-6 w-6">
                  <path
                    fill="currentColor"
                    d="M16 3C9.373 3 4 8.373 4 15c0 2.385.658 4.624 1.904 6.6L4 29l7.6-1.904A12.96 12.96 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.98 0-3.91-.58-5.56-1.67l-.4-.25-4.52 1.13 1.13-4.52-.25-.4A9.97 9.97 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.07-7.13c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.18.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.36-.01-.56-.01-.19 0-.5.07-.76.36-.26.29-1 1-.97 2.43.03 1.43 1.04 2.81 1.19 3 .15.19 2.05 3.14 5.01 4.28.7.3 1.25.48 1.68.61.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.18-1.41-.07-.13-.25-.2-.53-.34z"
                  />
                </svg>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  WhatsApp-First Experience
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Capture, recall, and organize your memories directly in
                  WhatsApp—no new app to learn, just seamless integration into
                  your daily life.
                </p>
              </div>
            </div>
            {/* AI-Powered Personal Memory */}
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                {/* AI/Brain icon */}
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path
                    fill="currentColor"
                    d="M12 2C7.03 2 3 6.03 3 11c0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7 0-3.86 3.14-7 7-7s7 3.14 7 7c0 3.86-3.14 7-7 7zm-1-13h2v2h-2V5zm0 12h2v2h-2v-2zm-7-7h2v2H4v-2zm14 0h2v2h-2v-2zm-9.07-4.07l1.41 1.41-1.41 1.41-1.41-1.41 1.41-1.41zm9.19 9.19l1.41 1.41-1.41 1.41-1.41-1.41 1.41-1.41zm-9.19 0l1.41 1.41-1.41 1.41-1.41-1.41 1.41-1.41zm9.19-9.19l1.41 1.41-1.41 1.41-1.41-1.41 1.41-1.41z"
                  />
                </svg>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  AI-Powered Personal Memory
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Memora uses advanced AI to capture, transcribe, and
                  intelligently organize your text, voice, and call memories for
                  instant recall.
                </p>
              </div>
            </div>
            {/* Privacy & Accessibility */}
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                {/* Shield/Lock icon for privacy */}
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path
                    fill="currentColor"
                    d="M12 2l7 6v6c0 5-3.58 9.74-7 10-3.42-.26-7-5-7-10V8l7-6zm0 2.18L6 8.09V14c0 4.08 2.77 8.06 6 8.44 3.23-.38 6-4.36 6-8.44V8.09l-6-3.91zM12 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
                  />
                </svg>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Privacy & Accessibility
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Your data is protected with end-to-end encryption and full
                  ownership. Memora works on any device—no app install required,
                  instant onboarding for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to launch your SaaS?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Our template provides everything you need to get your SaaS up
                and running quickly. Don't waste time on boilerplate - focus on
                what makes your product unique.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <a href="https://github.com/nextjs/saas-starter" target="_blank">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full"
                >
                  View the code
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
