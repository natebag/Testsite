# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository contains structured workflows for AI-assisted development, focusing on Product Requirements Documents (PRDs) and task management. It implements a systematic approach to feature development through documented processes.

## Core Architecture

The repository follows a documentation-driven development approach with three main workflow components:

### 1. PRD Generation Process (`create-prd.md`)
- Creates detailed Product Requirements Documents in `/tasks/` directory
- Two-phase approach: clarifying questions first, then PRD generation
- Target audience: junior developers
- Output format: `prd-[feature-name].md`

### 2. Task List Generation (`generate-tasks.md`)
- Converts PRDs into actionable task lists
- Two-phase process: parent tasks first, then detailed sub-tasks
- Output format: `tasks-[prd-file-name].md`
- Includes "Relevant Files" section for implementation tracking

### 3. Task Execution Management (`process-task-list.md`)
- Implements strict one-sub-task-at-a-time execution
- Requires user permission before proceeding to next sub-task
- Completion protocol includes testing, staging, and conventional commits
- Parent tasks only marked complete after all sub-tasks are finished

## Development Workflow

1. **PRD Creation**: Use the PRD generation process to document feature requirements
2. **Task Planning**: Generate structured task lists from approved PRDs
3. **Implementation**: Follow the task execution protocol with user-controlled progression
4. **Quality Assurance**: Run full test suite before marking parent tasks complete

## Important Conventions

- All generated files go in `/tasks/` directory
- Use conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
- Maintain "Relevant Files" sections in task lists
- One sub-task implementation at a time with user approval gates
- Test suite must pass before committing completed parent tasks

## File Structure

- `create-prd.md` - PRD generation workflow rules
- `generate-tasks.md` - Task list creation process
- `process-task-list.md` - Task execution management
- `/tasks/` - Directory for all generated PRDs and task lists

This repository emphasizes controlled, documentation-first development with clear approval gates and quality checkpoints throughout the implementation process.