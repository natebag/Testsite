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
5. **Compliance Check**: Use claude-md-compliance-checker before final completion

## Important Conventions

- All generated files go in `/tasks/` directory
- Use conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
- Maintain "Relevant Files" sections in task lists
- One sub-task implementation at a time with user approval gates
- Test suite must pass before committing completed parent tasks
- **MANDATORY**: claude-md-compliance-checker must be used at every completion checkpoint

## Specialized Agent Usage Guidelines

### 🎯 **Agent Selection Matrix**

#### **Core Implementation Agents**
- **ui-production-builder**: Production UI components, Tailwind CSS, shadcn/ui, React
- **web3-wallet-verifier**: Solana blockchain, Phantom wallet, SPL token operations
- **api-contract-designer**: REST/GraphQL APIs, database schemas, backend contracts
- **universal-testing-verification**: Comprehensive testing across all platform aspects

#### **Platform Optimization Agents**  
- **security-performance-auditor**: Performance budgets, security baselines, pre-merge checks
- **retro-xbox-ui-designer**: Xbox 360 dashboard wireframes, visual specifications
- **release-quality-gatekeeper**: Production deployment readiness, release validation
- **metrics-analytics-architect**: Analytics infrastructure, dashboards, experimentation

#### **Strategic Planning Agents**
- **prd-milestone-architect**: Convert ideas into structured PRDs and roadmaps
- **community-growth-strategist**: User acquisition, engagement loops, tournaments
- **orchestration-product-manager**: Multi-agent coordination, task priorities, QA cycles

#### **Quality Control Agent** 
- **claude-md-compliance-checker**: Verify workflow compliance, validate processes

### 🔄 **Agent Usage Protocols**

#### **Task Initiation Protocol**
1. **orchestration-product-manager**: Plan and coordinate multi-agent workflow
2. **Appropriate specialist**: Implement core functionality  
3. **universal-testing-verification**: Validate implementation
4. **claude-md-compliance-checker**: Verify CLAUDE.md compliance
5. **orchestration-product-manager**: Final quality review and approval

#### **Quality Gate Requirements**
- Every sub-task completion requires quality control validation
- Every parent task completion requires compliance checking
- Every major feature requires security and performance auditing
- Every release preparation requires comprehensive gatekeeper review

#### **Stop Point Protocols**
At every stop point or pause, the following must occur:
1. **Current state documentation** by orchestration-product-manager
2. **Compliance verification** by claude-md-compliance-checker  
3. **Progress report** to CEO tracking system
4. **Quality checkpoint** before proceeding

#### **New Feature Development Protocol**
1. **prd-milestone-architect**: Create PRD and milestones
2. **retro-xbox-ui-designer**: Create wireframes and visual specs (if UI)
3. **api-contract-designer**: Design backend contracts (if backend)
4. **ui-production-builder** or **web3-wallet-verifier**: Core implementation
5. **universal-testing-verification**: Comprehensive testing
6. **security-performance-auditor**: Security and performance validation
7. **claude-md-compliance-checker**: Process compliance verification
8. **release-quality-gatekeeper**: Production readiness assessment

## File Structure

- `create-prd.md` - PRD generation workflow rules
- `generate-tasks.md` - Task list creation process
- `process-task-list.md` - Task execution management
- `/tasks/` - Directory for all generated PRDs and task lists

This repository emphasizes controlled, documentation-first development with clear approval gates and quality checkpoints throughout the implementation process.