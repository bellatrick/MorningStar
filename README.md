# MorningStar MVP

MorningStar is a collaborative 2-player question game focused on intimacy and shared discovery, built for global cross-device play.

## 🚀 Quick Start (Netlify Deployment)

This app is designed as a modern ESM-based React SPA.

1. **Connect to Netlify**:
   - Push this code to a GitHub repository.
   - Link that repository to a new site on [Netlify](https://app.netlify.com).
   - **Build Command**: Use the one provided in `netlify.toml` (it runs automatically).
   - **Publish Directory**: `.` (the root folder).

2. **Configure Supabase Realtime**:
   - Create a free project at [supabase.com](https://supabase.com).
   - In Netlify, go to **Site Settings > Environment Variables**.
   - Add the following variables:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon/Public Key.
   - **Trigger a new deploy** for the changes to take effect.

## 🛠 Tech Stack

- **React 18**: UI Logic and state management.
- **Supabase Realtime**: Handles the "Global Bridge" allowing a phone in London to sync with a phone in New York instantly.
- **Tailwind CSS**: High-performance styling via CDN.
- **LocalStorage**: Ensures your progress isn't lost if you accidentally close the browser tab.

## 🎮 How to Play

1. **Host**: Click "Start New Discovery". You'll get a unique 6-digit access code.
2. **Invite**: Send the URL or the 6-digit code to your partner.
3. **Guest**: Click "Join Existing Room" and enter the code.
4. **Interact**: Answers are "Encrypted" (blurred) until **both** of you have submitted your response for that specific question. Once both are in, the truth is revealed.