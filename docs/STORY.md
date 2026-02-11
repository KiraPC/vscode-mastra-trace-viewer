Hello folks,

I've been working with [Mastra](https://mastra.ai) to build AI agents, and there was one thing that kept interrupting my flow: constantly switching between VS Code and the browser just to check agent traces.

Even worse, I needed to compare traces from two different agent configurations. One setup wasn't giving me the expected output, and I wanted to understand why. The Mastra dashboard is great, but there was no way to export traces—and I needed the raw JSON to feed them to an AI for comparison. That's the key insight: JSON export wasn't just for manual diffing, it was for letting AI analyze the differences.

So I did what any developer would do—I decided to build a VS Code extension to solve both problems.

I used BMAD to develop the extension. Yesterday evening I defined the specs: traces in sidebar, span hierarchy, input/output details, JSON export. Then I handed it to the dev agent and went back to my other work.

The agent built the extension while I occasionally checked in to test and give feedback. Total time to MVP: a few hours, most of which was testing rather than coding.

You can find the extension [here](https://github.com/KiraPC/vscode-mastra-trace-viewer) if you like to test it locally.


## The Result

Now I can:
- ✅ See all my Mastra traces directly in VS Code
- ✅ Navigate the span hierarchy with expand/collapse
- ✅ View detailed input/output for any span
- ✅ Export traces as JSON for AI-powered comparison

The JSON export was the killer feature for debugging. I exported traces from both agent configurations, gave them to Copilot, and asked it to compare them. It immediately identified the differences in how the agent was processing the input—something that would have taken me much longer to spot manually. Copilot then suggested how to adjust the prompt to get the expected output. Problem solved.

**The meta moment:** I used AI to build a tool that exports data for AI to analyze. AI helping AI helping me.

## Key Takeaways

1. **AI-assisted development is real** — Not hype, not "it writes hello world". Actual, useful software.

2. **The human is still essential** — I defined the problem, made architectural decisions, tested, and provided feedback. The AI handled the implementation details.

3. **Background execution changes everything** — While the agent was coding, I was doing other work. That's a fundamentally different development model.

4. **Solve your own problems first** — The best tools come from scratching your own itch.

## Try It Yourself

The extension is open source: [vscode-mastra-trace-viewer](https://github.com/KiraPC/vscode-mastra-trace-viewer)

If you're using Mastra and want trace visualization in VS Code, give it a try. PRs welcome!

---

*Built with [Mastra](https://mastra.ai) + [BMAD](https://github.com/bmadcode/BMAD-METHOD) + [GitHub Copilot](https://github.com/features/copilot)*
