import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
      <div className="container max-w-screen-xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Ready to Free Up Space?
        </h2>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
          Download CodeShredder now and reclaim gigabytes of disk space
          from old build artifacts and caches.
        </p>
        <Link to="/download">
          <Button
            size="lg"
            variant="secondary"
            className="text-base px-8 bg-white text-blue-700 hover:bg-blue-50 group"
          >
            Download for Free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
