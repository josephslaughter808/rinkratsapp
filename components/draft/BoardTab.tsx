"use client";

import DraftBoard from "./DraftBoard";

export default function BoardTab() {
  // later we’ll pass a real draftId from the page
  const draftId = "demo-draft-id";

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Draft Board</h2>
      <DraftBoard draftId={draftId} />
    </div>
  );
}
