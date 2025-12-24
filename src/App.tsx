import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardStyle } from '@capacitor/keyboard';
import { useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import LeagueSelectionPage from './pages/LeagueSelectionPage';
import CategorySelectionPage from './pages/CategorySelectionPage';
import TeamSelectionPage from './pages/TeamSelectionPage';
import PlayerSelectionPage from './pages/PlayerSelectionPage';
import MatchListPage from './pages/MatchListPage';
import MatchCreationPage from './pages/MatchCreationPage';
import ModernScoringPage from './pages/ModernScoringPage';

function App() {
  const { isAuthenticated, isUmpire, loading } = useAuth();

  useEffect(() => {
    // Configure status bar for mobile (dark theme)
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#000000' });

    // Configure keyboard
    Keyboard.setStyle({ style: KeyboardStyle.Dark });
    Keyboard.setResizeMode({ mode: 'body' });

    // Handle app state changes
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-white text-lg'>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    );
  }

  if (!isUmpire) {
    return (
      <div className='min-h-screen bg-black text-white flex items-center justify-center p-4'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>
          <p className='text-gray-400 mb-6'>
            This app is for umpires only. Please contact an administrator if you
            need access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black text-white'>
      <Routes>
        {/* League Selection */}
        <Route path='/' element={<LeagueSelectionPage />} />

        {/* Umpire Workflow: League → Category → Team → Players → Create Match */}
        <Route path='/league/:leagueId' element={<CategorySelectionPage />} />
        <Route
          path='/league/:leagueId/category/:categoryId'
          element={<TeamSelectionPage />}
        />
        <Route
          path='/league/:leagueId/category/:categoryId/teams'
          element={<PlayerSelectionPage />}
        />
        <Route
          path='/league/:leagueId/category/:categoryId/teams/:team1Id/:team2Id/create-match'
          element={<MatchCreationPage />}
        />

        {/* Match Management */}
        <Route path='/league/:leagueId/matches' element={<MatchListPage />} />
        <Route
          path='/league/:leagueId/match/:matchId/score'
          element={<ModernScoringPage />}
        />

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </div>
  );
}

export default App;
