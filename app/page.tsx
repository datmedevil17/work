import Link from "next/link";
import { Coins, Workflow, Network, Code2, ArrowRight, Link as LinkIcon } from "lucide-react";

export default function Home() {
  const tools = [
    {
       href: "/editor",
       title: "IDE Editor",
       description: "Full-featured Solana code editor with build & deploy.",
       icon: Code2,
       color: "text-blue-500",
       bg: "bg-blue-500/10"
    },
    {
       href: "/token-manager",
       title: "Token Manager",
       description: "Create and manage SPL Tokens and NFTs.",
       icon: Coins,
       color: "text-yellow-500",
       bg: "bg-yellow-500/10"
    },
    {
       href: "/visualizer",
       title: "Program Visualizer",
       description: "Visualize Anchor IDL structure and accounts.",
       icon: Workflow,
       color: "text-purple-500",
       bg: "bg-purple-500/10"
    },
    {
       href: "/network-tools",
       title: "Network Tools",
       description: "Airdrops, RPC switching, and connection testing.",
       icon: Network,
       color: "text-green-500",
       bg: "bg-green-500/10"
    },
    {
       href: "/builder",
       title: "Flow Builder",
       description: "No-code visual script builder for Solana.",
       icon: LinkIcon,
       color: "text-orange-500",
       bg: "bg-orange-500/10"
    }
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-8 text-center font-sans">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl mb-4">
            Solana<span className="text-blue-600">Suite</span>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Everything you need for Solana development. Write code, manage tokens, and visualize programs in one place.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {tools.map((tool) => (
            <Link 
                key={tool.href} 
                href={tool.href}
                className="group relative flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-lg text-left"
            >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.bg} ${tool.color}`}>
                    <tool.icon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 flex-1">
                    {tool.description}
                </p>
                <div className="flex items-center text-sm font-medium text-zinc-900 dark:text-zinc-200 mt-auto">
                    Launch Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
        ))}
      </div>
      
      <div className="mt-12 text-zinc-500 text-sm">
        <a href="https://solana.com/docs" target="_blank" className="hover:underline hover:text-blue-500">Documentation</a>
        <span className="mx-2">•</span>
        <span>v0.2.0 Beta</span>
      </div>
    </div>
  );
}
