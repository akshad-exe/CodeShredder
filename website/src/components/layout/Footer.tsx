import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-xl">CodeShredder</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              Fast, safe desktop cleanup for developers. Find and remove
              node_modules, build artifacts, caches, and more.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="/#features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="/#/download"
                  className="hover:text-foreground transition-colors"
                >
                  Download
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/akshad-exe/CodeShredder/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Release Notes
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/akshad-exe/CodeShredder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center space-x-1"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/akshad-exe/CodeShredder/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Report Issues
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} CodeShredder. Open source under
              MIT License.
            </p>
            <p className="text-muted-foreground text-sm flex items-center">
              Built with <Heart className="h-4 w-4 mx-1 text-red-500" /> for
              developers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
