"use client";

import { useState } from "react";

interface StartDialogProps {
  defaultMaxRounds?: number;
  onConfirm: (topic: string, maxRounds: number) => void;
  onCancel: () => void;
}

export default function StartDialog({
  defaultMaxRounds = 10,
  onConfirm,
  onCancel,
}: StartDialogProps) {
  const [topic, setTopic] = useState("");
  const [maxRounds, setMaxRounds] = useState(defaultMaxRounds);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm(topic.trim(), maxRounds);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Start Autonomous Run
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Topic / Prompt
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should the agents discuss?"
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Max Rounds
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxRounds}
              onChange={(e) => setMaxRounds(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
