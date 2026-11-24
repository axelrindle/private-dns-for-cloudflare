package stats

import (
	"testing"
	"time"
)

func TestHistory(t *testing.T) {
	now := time.Date(2026, 1, 1, 12, 0, 30, 0, time.UTC)
	s := &Stats{now: func() time.Time { return now }}

	s.Record(1)
	s.Record(1)
	s.Record(28)
	s.Record(4242)

	h := s.History()
	if len(h) != slots {
		t.Fatalf("expected %d buckets, got %d", slots, len(h))
	}

	last := h[len(h)-1]
	if last.Time != now.Truncate(time.Minute).UnixMilli() {
		t.Errorf("last bucket has wrong time %d", last.Time)
	}
	if last.Counts["A"] != 2 || last.Counts["AAAA"] != 1 || last.Counts["TYPE4242"] != 1 {
		t.Errorf("unexpected counts %v", last.Counts)
	}

	// one hour later the bucket must have rotated out
	now = now.Add(time.Hour)
	for _, b := range s.History() {
		if len(b.Counts) != 0 {
			t.Fatalf("expected empty history, got %v at %d", b.Counts, b.Time)
		}
	}

	// recording into the reused slot must not carry over old counts
	s.Record(28)
	if c := s.History()[slots-1].Counts; c["A"] != 0 || c["AAAA"] != 1 {
		t.Errorf("stale counts in reused slot: %v", c)
	}
}
