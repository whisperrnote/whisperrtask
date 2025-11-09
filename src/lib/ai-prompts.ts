import type { PromptTemplate } from '../types/ai'

export const AI_PROMPTS: Record<string, PromptTemplate> = {
  TASK_PRIORITIZATION: {
    id: 'task_prioritization',
    version: '1.0',
    name: 'Task Prioritization',
    description: 'Calculate value and effort scores for tasks based on context',
    template: `You are an AI project manager analyzing a task to calculate its value and effort scores.

Task Details:
Title: {{title}}
Description: {{description}}
Project: {{project}}

Strategic Context:
{{strategicContext}}

Available Resources:
{{resources}}

Based on this information:
1. Calculate a Value Score (0-100) considering:
   - Strategic alignment with goals
   - Impact on key metrics
   - Stakeholder importance
   - Urgency and deadlines

2. Calculate an Effort Score (0-100) considering:
   - Technical complexity
   - Dependencies on other tasks
   - Team capacity and availability
   - Historical velocity on similar tasks

Respond with JSON:
{
  "valueScore": <number>,
  "effortScore": <number>,
  "reasoning": "<explanation>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`,
    variables: ['title', 'description', 'project', 'strategicContext', 'resources'],
    examples: [
      {
        input: {
          title: 'Implement user authentication',
          description: 'Add OAuth 2.0 login with Google and GitHub',
          project: 'Platform Launch',
          strategicContext: 'Critical for Q1 launch, blocking 3 other features',
          resources: '2 senior engineers available, existing OAuth library',
        },
        output: JSON.stringify({
          valueScore: 85,
          effortScore: 40,
          reasoning: 'High value due to launch criticality and downstream dependencies. Moderate effort with available expertise and existing library.',
          recommendations: [
            'Prioritize this task in current sprint',
            'Assign to senior engineer familiar with OAuth',
          ],
        }),
      },
    ],
  },

  ACTION_ITEM_DETECTION: {
    id: 'action_item_detection',
    version: '1.0',
    name: 'Meeting Action Item Detection',
    description: 'Extract actionable commitments from meeting transcripts',
    template: `Analyze this meeting transcript and extract all actionable commitments.

Meeting: {{meetingTitle}}
Transcript:
{{transcript}}

For each action item, identify:
1. The specific task or commitment
2. Who committed to it (speaker)
3. Any mentioned deadline or timeframe
4. Priority level (high/medium/low)

Respond with JSON array:
[
  {
    "task": "<action description>",
    "assignee": "<person name>",
    "dueDate": "<extracted date or null>",
    "priority": "<high|medium|low>",
    "context": "<relevant quote from transcript>",
    "timestamp": <seconds into meeting>
  }
]`,
    variables: ['meetingTitle', 'transcript'],
  },

  CONTEXT_EXTRACTION: {
    id: 'context_extraction',
    version: '1.0',
    name: 'Context Extraction',
    description: 'Extract relevant context for a task from notes and meetings',
    template: `Analyze these sources and extract relevant context for the task.

Task: {{taskTitle}}

Sources:
{{sources}}

Extract:
1. Key concepts and requirements
2. Relevant decisions or constraints
3. Related work or dependencies
4. Important people or stakeholders

Respond with JSON:
{
  "keywords": ["<keyword1>", "<keyword2>"],
  "relatedDecisions": ["<decision1>"],
  "dependencies": ["<dependency1>"],
  "stakeholders": ["<person1>"],
  "summary": "<2-3 sentence context summary>"
}`,
    variables: ['taskTitle', 'sources'],
  },

  BOTTLENECK_PREDICTION: {
    id: 'bottleneck_prediction',
    version: '1.0',
    name: 'Bottleneck Prediction',
    description: 'Predict potential bottlenecks in task execution',
    template: `Analyze this task and its context to predict potential bottlenecks.

Task: {{taskTitle}}
Status: {{status}}
Dependencies: {{dependencies}}
Team Capacity: {{teamCapacity}}
Historical Data: {{historicalData}}

Identify:
1. Potential blocking factors
2. Resource constraints
3. Dependency risks
4. Timeline concerns

Respond with JSON:
{
  "bottlenecks": [
    {
      "type": "<resource|dependency|technical|communication>",
      "description": "<what could block progress>",
      "likelihood": "<high|medium|low>",
      "impact": "<high|medium|low>",
      "mitigation": "<suggested action>"
    }
  ],
  "overallRisk": "<high|medium|low>",
  "recommendation": "<proactive action to take>"
}`,
    variables: ['taskTitle', 'status', 'dependencies', 'teamCapacity', 'historicalData'],
  },

  MESSAGE_DRAFTING: {
    id: 'message_drafting',
    version: '1.0',
    name: 'Message Drafting',
    description: 'Draft messages for task updates and notifications',
    template: `Draft a {{messageType}} message for this situation.

Context:
{{context}}

Recipient: {{recipient}}
Tone: {{tone}}

The message should be:
- Clear and concise
- Professional but friendly
- Action-oriented
- Include relevant context

Draft the message:`,
    variables: ['messageType', 'context', 'recipient', 'tone'],
  },

  TASK_BREAKDOWN: {
    id: 'task_breakdown',
    version: '1.0',
    name: 'Task Breakdown',
    description: 'Break down complex tasks into manageable subtasks',
    template: `Break down this task into smaller, actionable subtasks.

Task: {{taskTitle}}
Description: {{description}}
Constraints: {{constraints}}

Create 3-7 subtasks that:
1. Are independently completable
2. Have clear acceptance criteria
3. Follow logical sequence
4. Consider dependencies

Respond with JSON:
{
  "subtasks": [
    {
      "title": "<subtask title>",
      "description": "<what needs to be done>",
      "estimatedEffort": "<hours or story points>",
      "dependencies": ["<subtask index if dependent>"],
      "acceptanceCriteria": ["<criterion1>", "<criterion2>"]
    }
  ],
  "sequencing": "<parallel|sequential|mixed>",
  "totalEstimate": "<combined effort estimate>"
}`,
    variables: ['taskTitle', 'description', 'constraints'],
  },
}

// Register all prompts with the AI orchestrator when the module is loaded
import { aiOrchestrator } from './ai-orchestrator'

export function registerAIPrompts(): void {
  Object.values(AI_PROMPTS).forEach(prompt => {
    aiOrchestrator.registerTemplate(prompt)
  })
}

// Auto-register on module load
if (typeof window !== 'undefined') {
  registerAIPrompts()
}
