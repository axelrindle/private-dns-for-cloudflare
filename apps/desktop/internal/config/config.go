package config

import (
	"crypto/tls"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
)

// tldPattern matches a lowercase domain of one or more labels, e.g. "home.arpa".
// It also keeps the value safe to use as a file name in /etc/resolver.
var tldPattern = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$`)

type Config struct {
	Endpoint string `json:"endpoint"`
	Token    string `json:"token"`
	// InsecureSkipVerify disables TLS certificate validation for the endpoint,
	// e.g. for self-signed certificates.
	InsecureSkipVerify bool   `json:"insecureSkipVerify"`
	Port               uint16 `json:"port"`
	// Tld is the domain served by the forwarder, without a leading dot. Despite
	// the name it may have several labels, e.g. "home.arpa".
	Tld string `json:"tld"`
}

func (c Config) Validate() error {
	u, err := url.Parse(c.Endpoint)
	if err != nil {
		return fmt.Errorf("invalid endpoint: %w", err)
	}
	if u.Scheme != "https" && u.Scheme != "http" {
		return errors.New("endpoint must be a http(s) url")
	}
	if c.Port == 0 {
		return errors.New("port must not be 0")
	}
	if len(c.Tld) > 253 || !tldPattern.MatchString(c.Tld) {
		return errors.New("tld must be a lowercase domain like \"home.arpa\"")
	}

	return nil
}

// NewHTTPClient returns a client for talking to the upstream. With insecure set
// it accepts any TLS certificate the server presents.
func NewHTTPClient(insecure bool) *http.Client {
	if !insecure {
		return http.DefaultClient
	}

	t := http.DefaultTransport.(*http.Transport).Clone()
	t.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	return &http.Client{Transport: t}
}
