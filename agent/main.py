import asyncio
import json
import logging
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import silero, deepgram

from interview_state import InterviewState
from prompts import INTRO_AGENT_PROMPT, EXPERIENCE_AGENT_PROMPT, FINAL_FEEDBACK_PROMPT


load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mock-interview-agent")
state = InterviewState()

async def send_stage_update(room, stage: str, reason: str = ""):
    payload = {
        "stage": stage,
        "reason": reason,
    }

    try:
        await room.local_participant.publish_data(
            json.dumps(payload).encode("utf-8"),
            reliable=True,
            topic="stage_update",
        )
        state.log(f"Sent stage update to frontend: {payload}")
    except Exception as e:
        state.log(f"Failed to send stage update: {e}")


class ExperienceAgent(Agent):
    def __init__(self, room, chat_ctx=None):
        super().__init__(
            instructions=EXPERIENCE_AGENT_PROMPT,
            chat_ctx=chat_ctx,
        )
        self.room = room

    async def on_enter(self) -> None:
        state.log("ExperienceAgent entered.")

        await send_stage_update(
            self.room,
            "experience",
            "ExperienceAgent entered",
        )

        await self.session.generate_reply(
            instructions=(
                "Briefly tell the candidate we are moving to past experience. "
                "Ask them to describe one project, internship, or work experience."
            )
        )

    @function_tool()
    async def finish_experience_stage(self, context: RunContext):
        """
        Use this when the candidate has answered the past-experience question
        and the interview should end with final feedback.
        """
        state.complete_interview(reason="LLM detected experience stage completion")

        await send_stage_update(
            self.room,
            "completed",
            "LLM detected experience stage completion",
        )

        await self.session.generate_reply(
            instructions=FINAL_FEEDBACK_PROMPT
        )

        return "Interview completed with final feedback."


class IntroAgent(Agent):
    def __init__(self, room):
        super().__init__(instructions=INTRO_AGENT_PROMPT)
        self.room = room

    async def on_enter(self) -> None:
        state.log("IntroAgent entered.")

        await send_stage_update(
            self.room,
            "intro",
            "IntroAgent entered",
        )

        await self.session.generate_reply(
            instructions=(
                "Greet the candidate warmly and ask for their self-introduction. "
                "Do not ask multiple questions."
            )
        )

    @function_tool()
    async def finish_intro_stage(self, context: RunContext):
        """
        Use this when the candidate has completed their self-introduction
        and the interview should move to the past-experience stage.
        """
        state.move_to_experience(reason="LLM detected intro stage completion")

        await send_stage_update(
            self.room,
            "experience",
            "LLM detected intro stage completion",
        )

        return ExperienceAgent(
            room=self.room,
            chat_ctx=self.chat_ctx
        ), "Moving to past experience stage."

async def stage_fallback_monitor(session: AgentSession, room):
    """
    Time-based fallback.
    This guarantees the interview progresses even if the LLM does not call the handoff tool.
    """

    INTRO_MAX_SECONDS = 90
    EXPERIENCE_MAX_SECONDS = 150

    while True:
        await asyncio.sleep(5)

        if state.current_stage == "intro":
            elapsed = state.seconds_in_current_stage()

            if elapsed >= INTRO_MAX_SECONDS and not state.intro_completed:
                state.fallback_used = True

                state.move_to_experience(
                    reason=f"time fallback after {INTRO_MAX_SECONDS} seconds"
                )

                await send_stage_update(
                    room,
                    "experience",
                    f"time fallback after {INTRO_MAX_SECONDS} seconds",
                )

                session.update_agent(ExperienceAgent(room=room))

                await session.generate_reply(
                    instructions=(
                        "The self-introduction stage has reached the time limit. "
                        "Smoothly transition to the past-experience stage. "
                        "Say one short sentence of feedback, then ask about one project or work experience."
                    )
                )

        elif state.current_stage == "experience":
            elapsed = state.seconds_in_current_stage()

            if elapsed >= EXPERIENCE_MAX_SECONDS and not state.experience_completed:
                state.fallback_used = True

                state.complete_interview(
                    reason=f"time fallback after {EXPERIENCE_MAX_SECONDS} seconds"
                )

                await send_stage_update(
                    room,
                    "completed",
                    f"time fallback after {EXPERIENCE_MAX_SECONDS} seconds",
                )

                await session.generate_reply(
                    instructions=(
                        "The past-experience stage has reached the time limit. "
                        "Give final interview feedback now. "
                        + FINAL_FEEDBACK_PROMPT
                    )
                )

        elif state.current_stage == "completed":
            break


async def entrypoint(ctx: JobContext):
    """
    LiveKit job entrypoint.
    Starts when a participant joins a LiveKit room.
    """

    global state
    state = InterviewState()

    await ctx.connect()
    state.log("Connected to LiveKit room.")

    session = AgentSession(
        stt=deepgram.STT(
            model="nova-3",
            language="en-US",
        ),
        llm="openai/gpt-4o-mini",
        tts=deepgram.TTS(
            model="aura-2-andromeda-en",
        ),
        vad=silero.VAD.load(),
        user_away_timeout=20.0,
        max_endpointing_delay=3.0,
    )

    await session.start(
        room=ctx.room,
        agent=IntroAgent(room=ctx.room),
    )

    asyncio.create_task(stage_fallback_monitor(session, ctx.room))


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))