# Agent Instructions

Before working in this repository, read [CLAUDE.md](CLAUDE.md). It is the shared source of project constraints for all agents, including planning approval, change scope, and preservation of existing work.

Read the applicable sections of [CONTRIBUTING](CONTRIBUTING.md) for code conventions and validation, and [ARCHITECTURE](ARCHITECTURE.md) when tracing module boundaries or data flow. Language links are available in those documents.

For tasks covered by a project skill, read the corresponding `SKILL.md` under [.claude/skills](.claude/skills). Skills can be read directly; no personal plugin installation or agent-specific command is required.

Maintain shared instructions in `CLAUDE.md` and skill bodies under `.claude/`. Keep `.agents/skills/` as lightweight discovery entries pointing to those bodies; update their descriptions and links when necessary, without copying the instructions.
