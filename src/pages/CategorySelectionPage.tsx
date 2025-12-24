import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trophy, Users, List } from 'lucide-react'
import { useGetLeagueCategoriesQuery } from '@/store/api'

const CategorySelectionPage = () => {
  const navigate = useNavigate()
  const { leagueId } = useParams<{ leagueId: string }>()

  const { data: categories = [], isLoading: loading, error } = useGetLeagueCategoriesQuery(leagueId || '', {
    skip: !leagueId,
  })

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/league/${leagueId}/category/${categoryId}`)
  }

  const handleViewMatches = () => {
    navigate(`/league/${leagueId}/matches`)
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-light">Select Category</h1>
            <p className="text-muted-foreground text-sm">Choose a category to create or score matches</p>
          </div>
        </div>
        <button
          onClick={handleViewMatches}
          className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-lg"
        >
          <List className="h-4 w-4" />
          View Matches
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading categories...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/20 border border-destructive rounded-lg mb-6">
            <p className="text-destructive">Failed to load categories</p>
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl text-foreground mb-2">No Categories Available</h3>
            <p className="text-muted-foreground">
              No categories are set up for this league yet.
            </p>
            <p className="text-muted-foreground mt-2">
              Contact the league organizer to set up categories.
            </p>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg text-foreground mb-6">Available Categories</h2>
            <div className="grid gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategorySelect(category.category_id)}
                  className="card-modern cursor-pointer hover:shadow-lg transition-all p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium text-foreground mb-1">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-muted-foreground text-sm mb-2">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">
                          {category.match_type === 'singles' ? '🎾 Singles' : '🏓 Doubles'}
                        </span>
                        {category.win_points && (
                          <span>Win Points: {category.win_points}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-primary">
                      <ArrowLeft className="h-5 w-5 rotate-180" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategorySelectionPage