import { Card, CardContent } from "./ui/card"
import { ExternalLink, Github, BookOpen, Play } from "lucide-react"

export function LinksSection() {
  const links = [
    {
      icon: ExternalLink,
      title: "Starkscan Contract",
      description: "View deployed contract on Sepolia",
      href: "#",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Complete setup and development guide",
      href: "#",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Github,
      title: "GitHub Repository",
      description: "Fork and customize this template",
      href: "#",
      color: "from-gray-500 to-gray-600",
    },
    {
      icon: Play,
      title: "Live Demo",
      description: "Try the full game experience",
      href: "#",
      color: "from-red-500 to-red-600",
    },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {links.map((link) => {
        const Icon = link.icon
        return (
          <Card
            key={link.title}
            className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 cursor-pointer group"
          >
            <CardContent className="p-6">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{link.title}</h3>
              <p className="text-slate-400 text-sm">{link.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
