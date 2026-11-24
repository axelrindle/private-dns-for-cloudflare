package config

import "testing"

func TestValidateTld(t *testing.T) {
	cases := map[string]bool{
		"home":         true,
		"home.arpa":    true,
		"my-lab.local": true,
		"":             false,
		".home":        false,
		"home.":        false,
		"home..arpa":   false,
		"Home":         false,
		"-home":        false,
		"../etc":       false,
		"home/arpa":    false,
	}

	for tld, ok := range cases {
		cfg := Config{Endpoint: "https://example.com", Port: 15353, Tld: tld}
		if err := cfg.Validate(); (err == nil) != ok {
			t.Errorf("Validate() with tld %q: err = %v, want ok = %v", tld, err, ok)
		}
	}
}
