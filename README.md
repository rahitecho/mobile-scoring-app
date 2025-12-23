# Mobile Scoring App

A Capacitor-based mobile application for tournament match creation and scoring, built with React, TypeScript, and Supabase.

## Features

- **Match Creation**: Create league matches with team and player selection
- **Trump Matches**: Special matches with double points (bonus system)
- **Live Scoring**: Real-time score updates with game-by-game tracking
- **Match Management**: View all matches with filtering by status
- **Mobile-First**: Optimized for mobile devices with touch-friendly interface
- **Real-time Sync**: Connected to Supabase for live data synchronization

## Technology Stack

- **Frontend**: React 19.1.1, TypeScript
- **Mobile**: Capacitor 6.x for native mobile app capabilities
- **UI**: Tailwind CSS with custom mobile-optimized components
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Forms**: React Hook Form + Zod validation
- **Build**: Vite for fast development and optimized builds

## Prerequisites

- Node.js (v18 or higher)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Supabase account and project

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Update the environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=Mobile Scoring App
```

### 3. Database Setup

Ensure your Supabase database has the following tables:
- `leagues` - League information
- `league_category_settings` - Category settings with win_points
- `league_teams` - Team entities
- `league_team_members` - Team member assignments
- `matches` - Match entities with trump match support
- `profiles` - User profiles

### 4. Build the Web App

```bash
npm run build
```

### 5. Sync with Capacitor

```bash
npm run sync
```

## Development

### Web Development

```bash
npm run dev
```

This starts the development server at `http://localhost:5173`

### Android Development

1. **Open Android Studio:**
```bash
npm run open:android
```

2. **Run on device/emulator:**
```bash
npm run android
```

3. **Run with live reload:**
```bash
npm run android:dev
```

### iOS Development (macOS only)

1. **Open Xcode:**
```bash
npx cap open ios
```

2. **Run on device/simulator:**
```bash
npx cap run ios
```

## App Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main app pages
│   ├── HomePage.tsx    # Dashboard with navigation
│   ├── MatchCreationPage.tsx  # Match creation form
│   ├── MatchListPage.tsx      # Match list with filters
│   └── ScoringPage.tsx        # Live scoring interface
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and Supabase client
├── hooks/              # Custom React hooks
├── App.tsx            # Main app component with routing
└── main.tsx          # App entry point
```

## Key Features

### Match Creation
- League and category selection
- Team selection with player assignments
- Trump match option for bonus points
- Court number assignment
- Form validation with real-time feedback

### Live Scoring
- Game-by-game score tracking
- Automatic set calculation (best of 3 games)
- Match status management (pending → in_progress → completed)
- Real-time score persistence to database

### Match Management
- Filter matches by status (all, pending, in_progress, completed)
- Quick access to scoring interface
- Match details with player information and DUPR ratings
- Visual status indicators

## Database Integration

The app integrates with the main tournament management system's Supabase database:

- **Leagues**: Load active leagues for match creation
- **Categories**: Dynamic category loading with point values
- **Teams & Players**: Team member selection with DUPR ratings
- **Matches**: Create and update match records with scoring
- **Real-time**: Live updates when match data changes

## Build and Deployment

### Web Build
```bash
npm run build
```

### Android APK
1. Build the web app: `npm run build`
2. Sync with Capacitor: `npm run sync`
3. Open Android Studio: `npm run open:android`
4. Build APK from Android Studio

### Android Release
1. Configure signing in Android Studio
2. Build signed APK or Android App Bundle (AAB)
3. Upload to Google Play Console

## Troubleshooting

### Common Issues

1. **Capacitor Sync Errors**:
   ```bash
   npx cap clean android
   npm run build
   npm run sync
   ```

2. **Android Build Issues**:
   - Check Android SDK installation
   - Verify Gradle version compatibility
   - Clear Android Studio cache

3. **Database Connection Issues**:
   - Verify Supabase URL and anon key
   - Check network connectivity
   - Ensure database tables exist

### Development Tips

- Use `npm run android:dev` for live reload during development
- Test on real devices for accurate touch interaction
- Monitor browser console for debugging web version
- Use Android Studio logcat for native debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile
5. Submit a pull request

## License

This project is part of the tournament management system and follows the same licensing terms.