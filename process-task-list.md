# Task Execution Management Workflow

## Purpose
This workflow implements strict one-sub-task-at-a-time execution with mandatory user approval gates, comprehensive quality assurance, and compliance verification at every completion checkpoint.

## Core Execution Protocol

### One-Sub-Task-At-A-Time Rule
1. **Sequential Processing**: Only ONE sub-task may be in progress at any time
2. **Completion Verification**: Current sub-task must be 100% complete before proceeding
3. **User Approval Gate**: MANDATORY user permission required before starting next sub-task
4. **No Batching**: Sub-tasks cannot be combined or processed in parallel

### Sub-Task Completion Protocol
1. **Implementation**: Complete all code, configuration, and documentation changes
2. **Testing**: Run relevant test suites and verify functionality
3. **Quality Check**: Ensure code meets standards and requirements
4. **User Review**: Present completed work and request approval to proceed
5. **Status Update**: Mark sub-task as complete in task list

### Parent Task Completion Protocol
1. **All Sub-Tasks Verified**: Ensure every sub-task is marked complete
2. **Comprehensive Testing**: Run FULL test suite across platform
3. **Quality Assurance Review**: Complete QA cycle with dedicated QA agent
4. **Compliance Verification**: MANDATORY claude-md-compliance-checker validation
5. **Conventional Commit**: Create properly formatted commit message
6. **Final Approval**: Mark parent task complete only after all gates pass

## Quality Assurance Integration

### QA Review Requirements
- Every sub-task completion triggers QA review cycle
- QA agent must approve before proceeding to next sub-task
- Failed QA requires rework and re-review
- Parent task QA includes comprehensive platform testing

### Testing Requirements
- Sub-task level: Relevant unit and integration tests
- Parent task level: Full platform test suite
- Performance validation: Ensure no regressions
- Security audit: Verify security standards maintained

## Compliance Checkpoint Protocol

### Mandatory Compliance Checks
- **claude-md-compliance-checker**: MUST be used at every completion checkpoint
- **Workflow Adherence**: Verify proper process followed
- **Documentation Standards**: Ensure all requirements documented
- **Quality Standards**: Validate code and implementation quality

### Checkpoint Triggers
1. **Sub-task completion**: Before user approval request
2. **Parent task completion**: Before final commit
3. **Session end**: Before marking work session complete
4. **Milestone completion**: Before major feature release

## User Interaction Protocol

### Approval Request Format
```
## Sub-Task [X.Y] Completion Report
**Task**: [Sub-task description]
**Implementation Summary**: [What was accomplished]
**Files Modified**: [List of changed files with brief descriptions]
**Testing Status**: [Test results and validation]
**Quality Verification**: [QA approval status]

**Ready for Next Sub-Task**: [X.Y+1] - [Next task description]
**User Approval Required**: Please approve proceeding to next sub-task
```

### Progress Reporting Requirements
- Clear status of current sub-task
- Summary of completed work
- Next steps and dependencies
- Any blocking issues or concerns

## Error Handling and Recovery

### Blocking Issue Protocol
1. **Immediate Stop**: Halt progress if blocking issue encountered
2. **Issue Documentation**: Clearly document the problem
3. **Resolution Planning**: Identify steps to resolve blocking issue
4. **User Communication**: Inform user of situation and proposed solution
5. **Approval for Resolution**: Get approval before continuing

### Quality Gate Failures
1. **Stop Processing**: Immediately halt further progress
2. **Failure Analysis**: Document what failed and why
3. **Remediation Plan**: Create plan to address failures
4. **Rework Cycle**: Complete rework and re-test
5. **Re-validation**: Full compliance check after fixes

## Documentation Requirements

### Task List Maintenance
- Update task status in real-time
- Maintain "Relevant Files" section accuracy
- Document any scope or requirement changes
- Track dependencies and blocking relationships

### Commit Standards
- Use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.
- Include descriptive commit messages explaining the why
- Reference task numbers and requirements
- Include co-authored attribution for Claude Code

## Integration with Multi-Agent Workflow

### Agent Coordination
- **orchestration-product-manager**: Coordinates overall workflow
- **Specialist agents**: Implement specific technical components
- **universal-testing-verification**: Validates all implementations
- **claude-md-compliance-checker**: Ensures process compliance
- **Quality control agents**: Approve completion gates

### Handoff Protocol
- Clear documentation of work completed
- Status of any pending items or concerns
- Next steps and agent assignments
- Compliance verification status

This workflow ensures systematic, quality-controlled implementation with clear approval gates and comprehensive compliance verification at every step.