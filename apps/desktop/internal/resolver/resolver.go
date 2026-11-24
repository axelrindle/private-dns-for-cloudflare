// Package resolver points the system resolver at the local forwarder for a
// single top-level domain.
package resolver

import (
	"errors"

	"github.com/axelrindle/private-dns-for-cloudflare/internal/config"
)

// ErrCanceled is returned when the user dismisses the admin password prompt.
var ErrCanceled = errors.New("resolver setup canceled")

// Sync makes the system resolve *.<cfg.Tld> through the forwarder of cfg.
// old is the previously stored config and may be nil. Its resolver entry is
// removed if the tld changed.
func Sync(old *config.Config, cfg config.Config) error {
	return apply(old, cfg)
}

// Remove deletes the resolver entry for tld. It does nothing if there is none.
func Remove(tld string) error {
	return remove(tld)
}
