"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import InterviewRoom from "@/components/InterviewRoom";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function joinInterview() {
    const candidateName = username.trim();

    if (!candidateName) {
      setError("Please enter your name before starting the interview.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const room = `mock-interview-${uuidv4().slice(0, 8)}`;

      const response = await fetch(
        `/api/token?room=${encodeURIComponent(room)}&username=${encodeURIComponent(
          candidateName
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get token");
      }

      setUsername(candidateName);
      setRoomName(room);
      setToken(data.token);
      setServerUrl(data.url);
    } catch (error) {
      console.error(error);
      alert("Could not join interview. Check your environment variables.");
    } finally {
      setLoading(false);
    }
  }

  if (token && serverUrl) {
    return (
      <InterviewRoom
        token={token}
        serverUrl={serverUrl}
        roomName={roomName}
        username={username}
        onLeave={() => {
          setToken("");
          setServerUrl("");
          setRoomName("");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 p-8 shadow-xl">
        <p className="text-sm text-blue-300 mb-2">LiveKit AI Multi-Agent Demo</p>

        <h1 className="text-3xl font-bold mb-4">
          AI Mock Interview Agent
        </h1>

        <p className="text-slate-300 mb-6">
          Practice a realistic mock interview with an AI interviewer that guides the conversation,
          asks follow-up questions, and moves smoothly through each interview stage.
        </p>

        <label className="block text-sm text-slate-300 mb-2">
          Your name
        </label>

        <input
          className={`w-full rounded-lg bg-slate-800 border px-4 py-3 text-white outline-none focus:border-blue-400 ${
            error ? "border-red-500" : "border-slate-600"
          }`}
          placeholder="Pearl Patel"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
        />

        {error && (
          <p className="mt-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={joinInterview}
          disabled={loading || !username.trim()}
          className="mt-5 w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600 px-4 py-3 font-semibold"
        >
          {loading ? "Starting..." : "Start Mock Interview"}
        </button>
      </div>
    </main>
  );
}