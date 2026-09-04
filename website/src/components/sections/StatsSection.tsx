import { Download, Github, Users } from "lucide-react";

const stats = [
  {
    icon: Download,
    value: "3 Platforms",
    label: "Windows, macOS, Linux",
  },
  {
    icon: Github,
    value: "Open Source",
    label: "MIT License",
  },
  {
    icon: Users,
    value: "Built for Devs",
    label: "By a Developer",
  },
];

export function StatsSection() {
  return (
    <section className="py-24">
      <div className="container max-w-screen-xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center space-y-3 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-100 dark:border-blue-900/50 animate-fade-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <stat.icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
