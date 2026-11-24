//go:build !darwin

package resolver

import "github.com/axelrindle/private-dns-for-cloudflare/internal/config"

// apply is a no-op until other platforms are supported.
func apply(_ *config.Config, _ config.Config) error {
	return nil
}

func remove(_ string) error {
	return nil
}
