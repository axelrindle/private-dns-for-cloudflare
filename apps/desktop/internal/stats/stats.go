package stats

import (
	"fmt"
	"maps"
	"sync"
	"time"
)

const (
	resolution = time.Minute
	// slots * resolution is the maximum history kept.
	slots = 60
)

var typeNames = map[uint16]string{
	1:   "A",
	2:   "NS",
	5:   "CNAME",
	6:   "SOA",
	12:  "PTR",
	15:  "MX",
	16:  "TXT",
	28:  "AAAA",
	33:  "SRV",
	64:  "SVCB",
	65:  "HTTPS",
	255: "ANY",
}

func TypeName(qtype uint16) string {
	if name, ok := typeNames[qtype]; ok {
		return name
	}
	return fmt.Sprintf("TYPE%d", qtype)
}

type Bucket struct {
	// Start of the bucket as unix milliseconds.
	Time   int64          `json:"time"`
	Counts map[string]int `json:"counts"`
}

type bucket struct {
	start  time.Time
	counts map[string]int
}

// Stats counts DNS queries per type in a ring of per-minute buckets.
// Buckets older than an hour are overwritten as time moves on.
type Stats struct {
	mu      sync.Mutex
	buckets [slots]bucket
	now     func() time.Time
}

func New() *Stats {
	return &Stats{now: time.Now}
}

func index(start time.Time) int {
	return int(start.Unix()/int64(resolution/time.Second)) % slots
}

func (s *Stats) Record(qtype uint16) {
	s.mu.Lock()
	defer s.mu.Unlock()

	start := s.now().Truncate(resolution)
	b := &s.buckets[index(start)]
	if !b.start.Equal(start) {
		b.start = start
		b.counts = map[string]int{}
	}
	b.counts[TypeName(qtype)]++
}

// Reset drops all recorded queries.
func (s *Stats) Reset() {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.buckets = [slots]bucket{}
}

// History returns one bucket per minute for the last hour, oldest first.
// Minutes without queries have empty counts.
func (s *Stats) History() []Bucket {
	s.mu.Lock()
	defer s.mu.Unlock()

	end := s.now().Truncate(resolution)
	out := make([]Bucket, 0, slots)

	for i := slots - 1; i >= 0; i-- {
		start := end.Add(-time.Duration(i) * resolution)
		counts := map[string]int{}
		if b := s.buckets[index(start)]; b.start.Equal(start) {
			maps.Copy(counts, b.counts)
		}
		out = append(out, Bucket{Time: start.UnixMilli(), Counts: counts})
	}

	return out
}
