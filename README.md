
# MorningStar MVP

MorningStar is a collaborative 2-player question game focused on intimacy and shared discovery.

## Architecture

- **React 18**: Used for the frontend UI.
- **Tailwind CSS**: Providing the dark, high-contrast visual theme (Zinc/Pink/Purple).
- **BroadcastChannel API**: Implemented as the Realtime provider. It acts exactly like Supabase Realtime "Broadcast" mode, syncing state between tabs/clients on the same domain without requiring a backend for this demo environment.
- **LocalStorage**: Handles persistence. Even on refresh, your answers and your role stay pinned to that specific `roomId`.

## The Reveal Logic

1. **Answer Submission**: When a user submits an answer, it is stored locally under their slot (`userA` or `userB`) and broadcasted via the Realtime channel.
2. **State Sync**: The other client receives the broadcast and updates their local state. If the other user hasn't answered yet, the received answer remains hidden in the UI but present in the state.
3. **The Trigger**: The `QuestionCard` component computes `isRevealed` as `!!(myAnswer && otherAnswer)`. 
4. **Visuals**: Until `isRevealed` is true, the "Their Answer" box remains in a blurred/hidden state. Once both flags are truthy, CSS transitions trigger to smoothly reveal the content.

## How to use
1. Open the app.
2. Share the URL (including the hash) with a friend.
3. One person picks **Player 1**, the other picks **Player 2**.
4. Start answering questions!
