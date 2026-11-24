package main

import (
	"embed"

	"github.com/axelrindle/private-dns-for-cloudflare/internal/service"
	"github.com/axelrindle/private-dns-for-cloudflare/internal/stats"

	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

var appId = "de.axelrindle.cf-priv-dns"

var (
	//go:embed assets/phosphor/cloud-duotone.png
	iconRunning []byte
	//go:embed assets/phosphor/cloud-slash-duotone.png
	iconStopped []byte
	//go:embed assets/phosphor/cloud-x-duotone.png
	iconError []byte
	//go:embed assets/phosphor/cloud-warning-duotone.png
	iconWarn []byte
)

func main() {
	kr := service.NewKeyringService(appId)
	st := stats.New()
	dns := service.NewDnsService(kr, st)

	app := application.New(application.Options{
		Name:        "Private DNS for Cloudflare",
		Description: "Connect to a private DNS worker on Cloudflare.",
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: appId,
		},
		Services: []application.Service{
			application.NewService(kr),
			application.NewService(dns),
			application.NewService(service.NewStatsService(st)),
			application.NewService(&service.AutostartService{}),
			application.NewService(&service.UpstreamService{}),
		},
		Assets: application.AssetOptions{
			Handler:        application.AssetFileServerFS(assets),
			DisableLogging: true,
		},
	})

	// update(app)

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

	tray := app.SystemTray.New()
	tray.SetIcon(iconStopped)
	tray.OnClick(func() {
		log.Print("showing window")
		w.Show()
	})

	menu := app.NewMenu()
	menu.Add("Toggle").OnClick(func(ctx *application.Context) {
		if dns.IsRunning() {
			dns.Stop()
		} else {
			dns.Start()
		}
	})

	tray.SetMenu(menu)

	defer app.Event.On(service.EventDnsRunning, func(event *application.CustomEvent) {
		running := event.Data.(bool)
		if running {
			tray.SetIcon(iconRunning)
		} else {
			tray.SetIcon(iconStopped)
		}
	})()

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
