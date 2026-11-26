package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/wailsapp/wails/v3/pkg/application"
	"go.uber.org/fx"
)

//go:embed all:frontend/dist
var assets embed.FS

const appId = "de.axelrindle.cf-priv-dns"

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

// Set at build time via -ldflags -X, see LDFLAGS in Taskfile.yml.
var (
	Version        = "dev"
	CommitHash     = "unknown"
	BuildTimestamp = "unknown"
)

var (
	flagShowVersion bool
)

func buildVersion() string {
	return fmt.Sprintf("%s-%s (%s)", Version, CommitHash, BuildTimestamp)
}

func init() {
	flag.BoolVar(&flagShowVersion, "version", false, "show program version")
	flag.Parse()
	if flagShowVersion {
		fmt.Println(buildVersion())
		os.Exit(0)
	}

	log.SetOutput(os.Stderr)
}

func main() {
	var app *application.App

	fxApp := fx.New(
		fx.Provide(
			provideKeyringService,
			provideStatistics,
			provideStatisticService,
			provideDnsService,
			provideAutostartService,
			provideUpstreamService,
			provideBuildInfoService,
		),
		fx.Provide(
			provideApplication,
			provideWindow,
			provideTray,
		),
		// fx constructs lazily: request window and tray so they get created.
		fx.Invoke(func(*application.WebviewWindow, *application.SystemTray) {}),
		fx.Populate(&app),
	)
	if err := fxApp.Err(); err != nil {
		log.Fatal(err)
	}

	// app.Run blocks on the main thread (required on macOS), so it runs
	// between fx Start and Stop instead of inside an fx.Invoke.
	ctx := context.Background()
	if err := fxApp.Start(ctx); err != nil {
		log.Fatal(err)
	}

	runErr := app.Run()

	if err := fxApp.Stop(ctx); err != nil {
		log.Print(err)
	}
	if runErr != nil {
		log.Fatal(runErr)
	}

	// if err := initUpdater(app); err != nil {
	// 	log.Fatal(err)
	// }
}
