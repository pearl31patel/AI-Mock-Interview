# AI Mock Interview Coach

A real-time AI mock interview demo built with LiveKit AI Agents.  
This project implements two interview stages: self-introduction and past-experience discussion, using multi-agent handoff and time-based fallback logic.

![image alt](https://github.com/pearl31patel/AI-Mock-Interview/blob/9830f7d9ee60151d8fa55433b581e7548642ec05/img1.png)

![image alt](https://github.com/pearl31patel/AI-Mock-Interview/blob/9830f7d9ee60151d8fa55433b581e7548642ec05/img2.png)

## Project Goal

This demo was built for the AI Mock Interview challenge.

The main requirements are:

- Implement the self-introduction stage
- Implement the past-experience stage
- Use LiveKit AI Multi-Agent
- Provide smooth and natural transitions between stages
- Avoid interruptions, conflicts, and repetitive prompts
- Add time-based fallback logic so the interview continues even if normal switching does not trigger

## Features

- Real-time voice interview
- AI speaks first and asks interview questions
- Candidate answers using microphone
- Separate agent for self-introduction
- Separate agent for past experience
- Tool-based handoff between agents
- Stage state tracking
- Time-based fallback transition
- Final feedback generation
- React frontend with LiveKit room connection
- Python backend using LiveKit Agents

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- LiveKit React Components

### Backend

- Python
- LiveKit Agents
- OpenAI LLM
- Deepgram Speech-to-Text
- Deepgram Text-to-Speech
- Silero VAD

### Services

- LiveKit Cloud
- OpenAI API
- Deepgram API

## Project Structure

```text
AI-Mock-Interview/
│
├── agent/
│   ├── .env
│   ├── interview_state.py
│   ├── main.py
│   ├── prompts.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   └── token/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   └── InterviewRoom.tsx
│   │
│   ├── .env.local
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.ts
│
└── README.md
