package service

import (
	"errors"
	"sync"

	"github.com/axelrindle/private-dns-for-cloudflare/internal/config"
	"github.com/axelrindle/private-dns-for-cloudflare/internal/dns"
	"github.com/axelrindle/private-dns-for-cloudflare/internal/resolver"
	"github.com/axelrindle/private-dns-for-cloudflare/internal/stats"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// EventDnsRunning carries the new running state whenever the forwarder starts or stops.
const EventDnsRunning = "dns:running"

func init() {
	application.RegisterEvent[bool](EventDnsRunning)
}

var ErrNoConfig = errors.New("no config found, complete the setup first")

type DnsService struct {
	kr    *KeyringService
	stats *stats.Stats

	mu  sync.Mutex
	fwd *dns.DohForwarder // nil while stopped
}

func NewDnsService(kr *KeyringService, st *stats.Stats) *DnsService {
	return &DnsService{
		kr:    kr,
		stats: st,
	}
}

func (d *DnsService) Start() error {
	changed, err := d.start()
	if changed {
		emitRunning(true)
	}
	return err
}

func (d *DnsService) start() (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.fwd != nil {
		return false, nil
	}

	cfg, err := d.kr.ReadConfig()
	if err != nil {
		return false, err
	}
	if cfg == nil {
		return false, ErrNoConfig
	}

	fwd, err := dns.New(*cfg, d.stats)
	if err != nil {
		return false, err
	}
	if err := fwd.Start(); err != nil {
		return false, err
	}

	d.fwd = fwd

	return true, nil
}

func (d *DnsService) Stop() error {
	changed, err := d.stop()
	if changed {
		emitRunning(false)
	}
	return err
}

func (d *DnsService) stop() (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.fwd == nil {
		return false, nil
	}

	err := d.fwd.Close()
	d.fwd = nil
	return true, err
}

func (d *DnsService) IsRunning() bool {
	d.mu.Lock()
	defer d.mu.Unlock()

	return d.fwd != nil
}

func (d *DnsService) Toggle() error {
	if d.IsRunning() {
		return d.Stop()
	} else {
		return d.Start()
	}
}

// UpdateConfig stores cfg, points the system resolver for cfg.Tld at the
// forwarder and restarts the forwarder if it is running, so the new settings
// take effect immediately. Changing tld or port asks for the admin password.
func (d *DnsService) UpdateConfig(cfg config.Config) error {
	if err := cfg.Validate(); err != nil {
		return err
	}

	old, err := d.kr.ReadConfig()
	if err != nil {
		return err
	}
	// before storing, so a canceled prompt leaves the old config in place
	if err := resolver.Sync(old, cfg); err != nil {
		return err
	}

	if err := d.kr.WriteConfig(cfg); err != nil {
		return err
	}

	if !d.IsRunning() {
		return nil
	}
	if err := d.Stop(); err != nil {
		return err
	}
	return d.Start()
}

// Reset returns the app to its initial state: it removes the resolver entry,
// stops the forwarder, disables autostart and deletes the stored config and
// the recorded stats. Removing the resolver entry asks for the admin password.
func (d *DnsService) Reset() error {
	cfg, err := d.kr.ReadConfig()
	if err != nil {
		return err
	}
	// first, so a canceled prompt leaves everything in place
	if cfg != nil && cfg.Tld != "" {
		if err := resolver.Remove(cfg.Tld); err != nil {
			return err
		}
	}

	if err := d.Stop(); err != nil {
		return err
	}
	if err := application.Get().Autostart.Disable(); err != nil {
		return err
	}
	if err := d.kr.Reset(); err != nil {
		return err
	}
	d.stats.Reset()

	return nil
}

// ServiceShutdown is called by Wails when the app exits. No event is emitted
// because the windows are already gone at this point.
func (d *DnsService) ServiceShutdown() error {
	_, err := d.stop()
	return err
}

func emitRunning(running bool) {
	application.Get().Event.Emit(EventDnsRunning, running)
}
