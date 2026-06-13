# Merge Note: Legacy AGENTS.md Integration

Date: 2026-06-11

## Summary

This merge integrates the previous monolithic `AGENTS.md` into the newer file-driven Timiva workflow.

## Decisions

```text
1. Keep root AGENTS.md as the Cursor task operating guide.
2. Do not overwrite root AGENTS.md with the old monolithic agents document.
3. Move the 4-agent role model into agents/README.md and agents/*.md.
4. Keep detailed role files:
   - agents/experience-lead.md
   - agents/brand-guardian.md
   - agents/tech-architect.md
   - agents/growth-strategist.md
5. Archive the old monolithic AGENTS.md to docs/archive/legacy-agents-v1.md.
6. Update task and validation workflow to require Agent Routing.
```

## Why

The old `AGENTS.md` was a strong agent definition file, but the new root `AGENTS.md` must act as Cursor's task entry point. Keeping both as root-level AGENTS files would confuse Cursor.

## Final structure

```text
AGENTS.md = task entry / operating guide
agents/README.md = four-agent overview and routing rules
agents/*.md = detailed role definitions
docs/timiva-agent-review-workflow-v1.md = review process
docs/archive/legacy-agents-v1.md = old source preserved
```
