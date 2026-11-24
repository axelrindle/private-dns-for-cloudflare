package service

import "github.com/axelrindle/private-dns-for-cloudflare/internal/stats"

// StatsService exposes the query statistics read-only to the frontend.
type StatsService struct {
	s *stats.Stats
}

func NewStatsService(s *stats.Stats) *StatsService {
	return &StatsService{s}
}

// History returns query counts per type for each minute of the last hour, oldest first.
func (s *StatsService) History() []stats.Bucket {
	return s.s.History()
}
