import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative w-full mt-20 border-t border-white/10">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="group">
              <Image
                src="/dojo-hunt.svg"
                alt="DojoHunt"
                width={105}
                height={22}
                className="group-hover:opacity-80 transition-opacity duration-200"
              />
            </Link>
            <p className="text-sm text-white/70 leading-relaxed font-montserrat">
              Challenge yourself with coding problems while staking Ethereum
              tokens. Complete challenges to earn rewards.
            </p>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white mb-1 font-montserrat uppercase">
              Platform
            </h3>
            <Link
              href="/challenges"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Challenges
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Leaderboard
            </Link>
            <Link
              href="/staking"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Staking
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Dashboard
            </Link>
          </div>

          {/* Resources Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white mb-1 font-montserrat uppercase">
              Resources
            </h3>
            <Link
              href="/docs"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Documentation
            </Link>
            <Link
              href="/tutorials"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Tutorials
            </Link>
            <Link
              href="/faq"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              FAQ
            </Link>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white mb-1 font-montserrat uppercase">
              Legal
            </h3>
            <Link
              href="/privacy"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-montserrat"
            >
              Cookie Policy
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-xs text-white/50 text-center font-montserrat">
            © {new Date().getFullYear()} DojoHunt. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
