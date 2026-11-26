package main

import (
	"log"

	"github.com/axelrindle/private-dns-for-cloudflare/internal/service"
	"github.com/axelrindle/private-dns-for-cloudflare/internal/stats"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"go.uber.org/fx"
)

// serviceOut provides *T both as itself (for other constructors) and as an
// application.Service in the "services" group (for the Wails application).
type serviceOut[T any] struct {
	fx.Out

	Service *T
	Wails   application.Service `group:"services"`
}

// asService wraps svc for the Wails application. `wails3 generate bindings`
// detects services through NewService[T] and follows T through this generic
// helper to the concrete type at each call site.
func asService[T any](svc *T) serviceOut[T] {
	return serviceOut[T]{Service: svc, Wails: application.NewService(svc)}
}

func provideStatistics() *stats.Stats {
	return stats.New()
}

func provideKeyringService() serviceOut[service.KeyringService] {
	return asService(service.NewKeyringService(appId))
}

func provideStatisticService(st *stats.Stats) serviceOut[service.StatsService] {
	return asService(service.NewStatsService(st))
}

func provideDnsService(kr *service.KeyringService, st *stats.Stats) serviceOut[service.DnsService] {
	return asService(service.NewDnsService(kr, st))
}

func provideAutostartService() serviceOut[service.AutostartService] {
	return asService(&service.AutostartService{})
}

func provideUpstreamService() serviceOut[service.UpstreamService] {
	return asService(&service.UpstreamService{})
}

func provideBuildInfoService() serviceOut[service.BuildInfoService] {
	return asService(service.NewBuildInfoService(service.BuildInfo{
		Version:        Version,
		CommitHash:     CommitHash,
		BuildTimestamp: BuildTimestamp,
	}))
}

type provideApplicationParams struct {
	fx.In

	Services []application.Service `group:"services"`
}

func provideApplication(p provideApplicationParams) *application.App {
	return application.New(application.Options{
		Name:        "Private DNS for Cloudflare",
		Description: "Connect to a private DNS worker on Cloudflare.",
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: appId,
		},
		Services: p.Services,
		Assets: application.AssetOptions{
			Handler:        application.AssetFileServerFS(assets),
			DisableLogging: true,
		},
	})
}

func provideWindow(app *application.App) *application.WebviewWindow {
	w := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Name: "win",
		// Window sized to the golden ratio (1000 / 618 ≈ 1.618).
		Width:                 1000,
		Height:                618,
		DisableResize:         true,
		FullscreenButtonState: application.ButtonDisabled,
		BackgroundColour:      application.NewRGB(6, 7, 15),
		URL:                   "/",
		DevToolsEnabled:       app.Env.Info().Debug,
	})

	// Hide instead of destroying the window, so the tray can show it again.
	w.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		w.Hide()
		e.Cancel()
	})

	return w
}

type provideTrayParams struct {
	fx.In

	FC  fx.Lifecycle
	App *application.App
	Win *application.WebviewWindow
	Dns *service.DnsService
}

func provideTray(p provideTrayParams) *application.SystemTray {
	tray := p.App.SystemTray.New()
	tray.SetIcon(iconStopped)
	tray.OnClick(func() {
		log.Print("showing window")
		p.Win.Show()
	})

	menu := p.App.NewMenu()
	menu.Add("Toggle").OnClick(func(ctx *application.Context) {
		if p.Dns.IsRunning() {
			p.Dns.Stop()
		} else {
			p.Dns.Start()
		}
	})
	menu.AddSeparator()
	menu.AddRole(application.Quit)

	tray.SetMenu(menu)

	p.FC.Append(fx.StopHook(
		p.App.Event.On(service.EventDnsRunning, func(event *application.CustomEvent) {
			running := event.Data.(bool)
			if running {
				tray.SetIcon(iconRunning)
			} else {
				tray.SetIcon(iconStopped)
			}
		}),
	))

	return tray
}
