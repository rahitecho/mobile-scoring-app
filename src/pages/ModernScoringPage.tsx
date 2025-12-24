import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useGetMatchQuery, useUpdateMatchMutation } from '@/store/api';
import type { UpdateMatchScoreRequest } from '@/types';

const ModernScoringPage = () => {
  const { matchId, leagueId } = useParams<{
    matchId: string;
    leagueId: string;
  }>();
  const navigate = useNavigate();

  // RTK Query hooks
  const {
    data: match,
    isLoading: loading,
    error,
  } = useGetMatchQuery(matchId || '', {
    skip: !matchId,
  });
  const [updateMatch, { isLoading: saving }] = useUpdateMatchMutation();

  // Game and set scores
  const [team1Games, setTeam1Games] = useState<number[]>([0, 0, 0]);
  const [team2Games, setTeam2Games] = useState<number[]>([0, 0, 0]);
  const [team1Sets, setTeam1Sets] = useState(0);
  const [team2Sets, setTeam2Sets] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);

  // Flip animations
  const [team1Flipping, setTeam1Flipping] = useState(false);
  const [team2Flipping, setTeam2Flipping] = useState(false);

  // Match completion state
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  // Initialize scores when match data is loaded
  useEffect(() => {
    if (match) {
      const games1 = [
        match.team1_game1 || 0,
        match.team1_game2 || 0,
        match.team1_game3 || 0,
      ];
      const games2 = [
        match.team2_game1 || 0,
        match.team2_game2 || 0,
        match.team2_game3 || 0,
      ];

      setTeam1Games(games1);
      setTeam2Games(games2);
      setTeam1Sets(match.team1_score || 0);
      setTeam2Sets(match.team2_score || 0);

      // Determine current set based on scores
      let currentSetIndex = 0;
      for (let i = 0; i < 3; i++) {
        if (games1[i] === 0 && games2[i] === 0) {
          currentSetIndex = i;
          break;
        }
        if (i === 2) currentSetIndex = 2;
      }
      setCurrentSet(currentSetIndex);
    }
  }, [match]);

  const flipCard = async (team: 1 | 2, increase: boolean) => {
    if (team === 1) {
      setTeam1Flipping(true);
      setTimeout(() => setTeam1Flipping(false), 300);
    } else {
      setTeam2Flipping(true);
      setTimeout(() => setTeam2Flipping(false), 300);
    }

    // Wait for flip animation to start
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (team === 1) {
      if (increase) {
        setTeam1Games((prev) => {
          const newGames = [...prev];
          newGames[currentSet] = Math.min(newGames[currentSet] + 1, 99);
          return newGames;
        });
      } else {
        setTeam1Games((prev) => {
          const newGames = [...prev];
          newGames[currentSet] = Math.max(newGames[currentSet] - 1, 0);
          return newGames;
        });
      }
    } else {
      if (increase) {
        setTeam2Games((prev) => {
          const newGames = [...prev];
          newGames[currentSet] = Math.min(newGames[currentSet] + 1, 99);
          return newGames;
        });
      } else {
        setTeam2Games((prev) => {
          const newGames = [...prev];
          newGames[currentSet] = Math.max(newGames[currentSet] - 1, 0);
          return newGames;
        });
      }
    }
  };

  const calculateSets = (games1: number[], games2: number[]) => {
    let sets1 = 0,
      sets2 = 0;
    for (let i = 0; i < 3; i++) {
      const team1Games = games1[i];
      const team2Games = games2[i];

      // Only count as set win if:
      // 1. Score is 6-0, 6-1, 6-2, 6-3, 6-4 (team1 wins 6+ games with 2+ game lead)
      // 2. Or 7-5, 8-6, 9-7, etc. (team1 wins with 2+ game lead and both have 5+ games)
      // 3. Or other team wins with same logic
      if (team1Games >= 6 && team1Games - team2Games >= 2) {
        sets1++;
      } else if (team2Games >= 6 && team2Games - team1Games >= 2) {
        sets2++;
      }
      // For tiebreak scenarios (6-6), first to 7 wins
      else if (
        team1Games >= 7 &&
        team1Games - team2Games >= 1 &&
        team2Games >= 6
      ) {
        sets1++;
      } else if (
        team2Games >= 7 &&
        team2Games - team1Games >= 1 &&
        team1Games >= 6
      ) {
        sets2++;
      }
    }
    return { sets1, sets2 };
  };

  useEffect(() => {
    const { sets1, sets2 } = calculateSets(team1Games, team2Games);
    setTeam1Sets(sets1);
    setTeam2Sets(sets2);
  }, [team1Games, team2Games]);

  const saveMatch = async () => {
    if (!match) return;

    try {
      const { sets1, sets2 } = calculateSets(team1Games, team2Games);
      const isCompleted = sets1 >= 2 || sets2 >= 2;

      const updateData: UpdateMatchScoreRequest = {
        id: match.id,
        status: isCompleted ? 'completed' : 'in_progress',
        team1_score: sets1,
        team2_score: sets2,
        team1_game1: team1Games[0] || undefined,
        team1_game2: team1Games[1] || undefined,
        team1_game3: team1Games[2] || undefined,
        team2_game1: team2Games[0] || undefined,
        team2_game2: team2Games[1] || undefined,
        team2_game3: team2Games[2] || undefined,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
      };

      await updateMatch(updateData).unwrap();

      if (isCompleted) {
        setShowCompletionPopup(true);
        // setTimeout(() => {
        //   navigate(`/league/${leagueId}/matches`)
        // }, 2000)
      }
    } catch (err) {
      console.error('Failed to save match:', err);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='text-white text-lg'>Loading match...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className='min-h-screen bg-black text-white flex items-center justify-center p-4'>
        <div className='text-center'>
          <p className='text-gray-400 mb-4'>Match not found</p>
          <Link
            to={`/league/${leagueId}/matches`}
            className='text-blue-400 hover:text-blue-300'
          >
            Back to matches
          </Link>
        </div>
      </div>
    );
  }

  const getPlayerName = (name?: string) => {
    return name || 'Player';
  };

  // Team names and player names
  const team1Name = match.team1_name || 'Team 1';
  const team2Name = match.team2_name || 'Team 2';

  const team1Players =
    match.match_type === 'singles'
      ? getPlayerName(match.team1_player1_name)
      : `${getPlayerName(match.team1_player1_name)} / ${getPlayerName(
          match.team1_player2_name
        )}`;

  const team2Players =
    match.match_type === 'singles'
      ? getPlayerName(match.team2_player1_name)
      : `${getPlayerName(match.team2_player1_name)} / ${getPlayerName(
          match.team2_player2_name
        )}`;

  return (
    <div className='min-h-screen bg-black text-white flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4'>
        <Link
          to={`/league/${leagueId}/matches`}
          className='p-2 hover:bg-gray-800 rounded-lg'
        >
          <ArrowLeft className='h-6 w-6 text-gray-400' />
        </Link>
        <div className='text-center'>
          <h1 className='text-lg font-medium'>{match.league_name}</h1>
          <p className='text-sm text-gray-400'>{match.category_name}</p>
        </div>
        <button
          onClick={saveMatch}
          disabled={saving}
          className='px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm disabled:opacity-50'
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Main Scoring Area */}
      <div className='flex-1 flex flex-col justify-center px-6 py-8'>
        {/* Team Names and Player Names */}
        <div className='flex justify-between items-center mb-12'>
          <div className='text-left max-w-[40%]'>
            <h2 className='text-2xl font-light'>{team1Name}</h2>
            <p className='text-sm text-gray-400 mt-1'>{team1Players}</p>
          </div>
          <div className='text-right max-w-[40%]'>
            <h2 className='text-2xl font-light'>{team2Name}</h2>
            <p className='text-sm text-gray-400 mt-1'>{team2Players}</p>
          </div>
        </div>

        {/* Score Cards */}
        <div className='flex items-center justify-center gap-8 mb-8'>
          {/* Team 1 Score Card */}
          <div className='relative'>
            <div
              className={`w-32 h-48 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center cursor-pointer transform transition-transform duration-300 ${
                team1Flipping ? 'rotateX-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: team1Flipping ? 'rotateX(180deg)' : 'rotateX(0deg)',
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const touchY = e.touches[0].clientY - rect.top;
                const isTopHalf = touchY < rect.height / 2;
                flipCard(1, !isTopHalf);
              }}
            >
              <div className='text-6xl font-light'>
                {team1Games[currentSet]}
              </div>
              {/* Divider line */}
              <div className='absolute top-1/2 left-4 right-4 h-px bg-gray-600'></div>
            </div>
          </div>

          {/* Game Score Boxes */}
          <div className='flex flex-col gap-4'>
            {[0, 1, 2].map((gameIndex) => (
              <div key={gameIndex} className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gray-800 rounded border border-gray-600 flex items-center justify-center'>
                  <span className='text-lg font-medium'>
                    {team1Games[gameIndex]}
                  </span>
                </div>
                <div className='w-8 h-8 flex items-center justify-center'>
                  <div className='w-2 h-2 bg-gray-600 rounded-full'></div>
                  <div className='w-2 h-2 bg-gray-600 rounded-full ml-1'></div>
                </div>
                <div className='w-12 h-12 bg-gray-800 rounded border border-gray-600 flex items-center justify-center'>
                  <span className='text-lg font-medium'>
                    {team2Games[gameIndex]}
                  </span>
                </div>
              </div>
            ))}

            {/* Set Score Indicators */}
            <div className='flex justify-center gap-8 mt-4'>
              <div className='flex gap-1'>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < team1Sets ? 'bg-orange-500' : 'bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
              <div className='flex gap-1'>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < team2Sets ? 'bg-orange-500' : 'bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Team 2 Score Card */}
          <div className='relative'>
            <div
              className={`w-32 h-48 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center cursor-pointer transform transition-transform duration-300 ${
                team2Flipping ? 'rotateX-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: team2Flipping ? 'rotateX(180deg)' : 'rotateX(0deg)',
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const touchY = e.touches[0].clientY - rect.top;
                const isTopHalf = touchY < rect.height / 2;
                flipCard(2, !isTopHalf);
              }}
            >
              <div className='text-6xl font-light'>
                {team2Games[currentSet]}
              </div>
              {/* Divider line */}
              <div className='absolute top-1/2 left-4 right-4 h-px bg-gray-600'></div>
            </div>
          </div>
        </div>

        {/* Current Set Indicator */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full'>
            <span className='text-sm text-gray-400'>Set {currentSet + 1}</span>
          </div>
        </div>

        {/* Set Navigation */}
        <div className='flex justify-center gap-4'>
          {[0, 1, 2].map((setIndex) => (
            <button
              key={setIndex}
              onClick={() => setCurrentSet(setIndex)}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                currentSet === setIndex
                  ? 'border-orange-500 bg-orange-500 text-black'
                  : 'border-gray-600 text-gray-400'
              }`}
            >
              {setIndex + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className='p-6'>
        <div className='flex justify-center'>
          <button
            onClick={() => {
              setTeam1Games([0, 0, 0]);
              setTeam2Games([0, 0, 0]);
              setCurrentSet(0);
            }}
            className='w-16 h-16 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center'
          >
            <X className='h-6 w-6 text-gray-400' />
          </button>
        </div>
      </div>

      {/* Match Status */}
      {showCompletionPopup && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-gray-900 p-8 rounded-lg text-center max-w-sm mx-4'>
            <h3 className='text-2xl font-bold mb-4'>Match Complete!</h3>
            <p className='text-gray-300 mb-6'>
              Winner: {team1Sets > team2Sets ? team1Name : team2Name}
            </p>
            <button
              onClick={() => navigate(`/league/${leagueId}/matches`)}
              className='px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg'
            >
              Back to Matches
            </button>
          </div>
        </div>
      )}

      {/* Add flip card CSS */}
      <style jsx>{`
        @keyframes rotateX {
          0% {
            transform: rotateX(0deg);
          }
          50% {
            transform: rotateX(90deg);
          }
          100% {
            transform: rotateX(180deg);
          }
        }
        .rotateX-180 {
          animation: rotateX 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ModernScoringPage;
