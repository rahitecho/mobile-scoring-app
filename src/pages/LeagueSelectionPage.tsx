import { useNavigate } from 'react-router-dom'
import { LogOut, Trophy, Calendar, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGetUmpireAssignedLeaguesQuery } from '@/store/api'

const LeagueSelectionPage = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const { data: leagues = [], isLoading: loading, error } = useGetUmpireAssignedLeaguesQuery(user?.id || '', {
    skip: !user?.id,
  })

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'status-badge bg-primary/10 text-primary ring-primary/20'
      case 'ongoing':
        return 'status-badge status-success'
      case 'completed':
        return 'status-badge bg-muted text-muted-foreground ring-border'
      default:
        return 'status-badge bg-muted text-muted-foreground ring-border'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-light">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground text-sm">Select a league to manage</p>
        </div>
        <button
          onClick={handleSignOut}
          className="p-3 hover:bg-accent rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading assigned leagues...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/20 border border-destructive rounded-lg mb-6">
            <p className="text-destructive">Failed to load leagues</p>
          </div>
        )}

        {!loading && leagues.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl text-foreground mb-2">No Leagues Assigned</h3>
            <p className="text-muted-foreground">
              You haven't been assigned to any leagues yet.
            </p>
            <p className="text-muted-foreground mt-2">
              Contact your administrator for access.
            </p>
          </div>
        )}

        {!loading && leagues.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg text-foreground mb-6">Your Assigned Leagues</h2>
            {leagues.map((league) => (
              <div
                key={league.id}
                onClick={() => navigate(`/league/${league.id}`)}
                className="card-modern cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4 p-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium text-foreground mb-2">
                      {league.name}
                    </h3>
                    {league.description && (
                      <p className="text-muted-foreground text-sm mb-4">
                        {league.description}
                      </p>
                    )}
                  </div>
                  <span className={getStatusColor(league.status)}>
                    {league.status === 'upcoming' ? 'Upcoming' :
                     league.status === 'ongoing' ? 'Live' :
                     league.status === 'completed' ? 'Completed' :
                     league.status}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground px-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(league.start_date)} - {formatDate(league.end_date)}
                    </span>
                  </div>
                  {league.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{league.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border px-6 pb-6">
                  <div className="text-xs text-muted-foreground">
                    Assigned on {new Date(league.assigned_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LeagueSelectionPage