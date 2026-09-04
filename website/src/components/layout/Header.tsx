import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Github, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Download", href: "/download" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-xl items-center mx-auto px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="hidden sm:inline-block font-bold text-xl">
            CodeShredder
          </span>
        </Link>

        <nav className="flex-1 flex items-center justify-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/akshad-exe/CodeShredder"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
          <Link
            to="/download"
            className="hidden sm:flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Link>
          <button
            className="sm:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border">
          <div className="container py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
            <a
              href="https://github.com/akshad-exe/CodeShredder"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
