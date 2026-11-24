package dns

import (
	"net"
	"net/http"
	"net/url"
	"strings"

	"github.com/axelrindle/private-dns-for-cloudflare/internal/config"
)

// Recorder receives the QTYPE of every forwarded query.
type Recorder interface {
	Record(qtype uint16)
}

type DohForwarder struct {
	rec    Recorder
	client *http.Client

	endpoint *url.URL
	token    string
	port     uint16

	tcp []*net.TCPListener
	udp []*net.UDPConn
}

// New creates a forwarder. rec may be nil.
func New(cfg config.Config, rec Recorder) (*DohForwarder, error) {
	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	endpoint := strings.TrimRight(cfg.Endpoint, "/") + "/dns/query"
	u, err := url.Parse(endpoint)
	if err != nil {
		return nil, err
	}

	return &DohForwarder{
		rec:      rec,
		client:   config.NewHTTPClient(cfg.InsecureSkipVerify),
		endpoint: u,
		token:    cfg.Token,
		port:     cfg.Port,
	}, nil
}
