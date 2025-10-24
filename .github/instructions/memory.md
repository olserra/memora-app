# Memory Saving Strategy for LLM Chat

## When to Save Memories

The LLM should save information as memories when the user shares **personal, factual information** that could be useful for future conversations. Examples:

### Save:

- Personal details: name, age, occupation, location, preferences, hobbies
- Relationships: family members, friends, partners
- Important events: birthdays, anniversaries, trips, achievements
- Preferences: favorite foods, colors, activities, brands
- Goals and plans: career aspirations, upcoming events, learning objectives
- Health or habits: allergies, routines, exercise preferences
- Contact info: phone numbers, addresses (if shared)
- Opinions on topics: political views, beliefs, values (if expressed clearly)

### Don't Save:

- Greetings, small talk, or casual conversation
- General knowledge or facts not specific to the user
- Temporary information: current weather, time-sensitive plans already passed
- Sensitive/private information without explicit permission
- Repetitive or already known information
- Questions or requests (not statements of fact)
- Jokes, sarcasm, or non-literal statements

## How to Save

When deciding to save, the LLM should:

1. Extract the key factual information concisely (1-2 sentences max)
2. Use the format: [MEMORY: concise description of the fact]
3. Include this marker in the response, but continue the conversation naturally
4. Only save if the information is new and relevant

## Examples

User: "My girlfriend's name is Carla"
LLM Response: "Got it, I'll remember that your girlfriend's name is Carla. [MEMORY: User's girlfriend is named Carla]"

User: "I love pizza"
LLM Response: "Pizza is great! [MEMORY: User loves pizza]"

User: "Hello, how are you?"
LLM Response: "I'm doing well, thanks! How about you?" (no memory saved)
