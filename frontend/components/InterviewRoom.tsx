"use client";

import { useState } from "react";
import {
  DisconnectButton,
  LiveKitRoom,
  RoomAudioRenderer,
  TrackToggle,
  useDataChannel,
} from "@livekit/components-react";
import { Track } from "livekit-client";

type Props = {
  token: string;
  serverUrl: string;
  roomName: string;
  username: string;
  onLeave: () => void;
};

type Stage = "intro" | "experience" | "completed";

function InterviewContent({
  roomName,
  username,
}: {
  roomName: string;
  username: string;
}) {
  const [currentStage, setCurrentStage] = useState<Stage>("intro");

  useDataChannel("stage_update", (msg) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      const data = JSON.parse(text);

      if (
        data.stage === "intro" ||
        data.stage === "experience" ||
        data.stage === "completed"
      ) {
        setCurrentStage(data.stage);
      }
    } catch (error) {
      console.error("Failed to parse stage update:", error);
    }
  });

  const stageCardClass = (stage: Stage) => {
    const isActive = currentStage === stage;

    return isActive
      ? "rounded-xl bg-slate-800 p-4 border border-blue-500 shadow-lg"
      : "rounded-xl bg-slate-800 p-4 border border-slate-700";
  };

  const currentStageLabel =
    currentStage === "intro"
      ? "Self Introduction"
      : currentStage === "experience"
      ? "Past Experience"
      : "Final Feedback";

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl">
        <div className="mb-8">
          <p className="text-sm text-blue-300">Room: {roomName}</p>

          <h1 className="text-3xl font-bold mt-2">
            Mock Interview in Progress
          </h1>

          <p className="text-slate-300 mt-2">Candidate: {username}</p>

          <p className="mt-4 inline-block rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-200">
            Current Stage:{" "}
            <span className="font-semibold text-blue-300">
              {currentStageLabel}
            </span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className={stageCardClass("intro")}>
            <p className="text-sm text-blue-300">Stage 1</p>
            <h2 className="font-semibold">Self Introduction</h2>
            <p className="text-sm text-slate-400 mt-1">
              Tell the AI about yourself.
            </p>
          </div>

          <div className={stageCardClass("experience")}>
            <p className="text-sm text-purple-300">Stage 2</p>
            <h2 className="font-semibold">Past Experience</h2>
            <p className="text-sm text-slate-400 mt-1">
              Discuss one project or role.
            </p>
          </div>

          <div className={stageCardClass("completed")}>
            <p className="text-sm text-green-300">Final</p>
            <h2 className="font-semibold">Feedback</h2>
            <p className="text-sm text-slate-400 mt-1">
              Get practical improvement tips.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950 border border-slate-700 p-6 mb-6">
          <p className="text-lg font-semibold mb-2">Instructions</p>
          <p className="text-slate-300">
            Speak naturally. The AI will listen, ask questions, and move between
            stages automatically. If the conversation gets stuck, the system will 
            automatically continue to the next stage so your practice session stays on track.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <TrackToggle
            source={Track.Source.Microphone}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-3 font-semibold"
          />

          <DisconnectButton className="rounded-lg bg-red-600 hover:bg-red-500 px-6 py-3 font-semibold">
            Leave Interview
          </DisconnectButton>
        </div>
      </div>
    </div>
  );
}

export default function InterviewRoom({
  token,
  serverUrl,
  roomName,
  username,
  onLeave,
}: Props) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={onLeave}
        className="min-h-screen"
      >
        <InterviewContent roomName={roomName} username={username} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}