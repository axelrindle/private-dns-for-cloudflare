package main

import (
	"context"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/updater"
	"github.com/wailsapp/wails/v3/pkg/updater/providers/endpoint"
)

func update(app *application.App) error {
	updateManifest, err := endpoint.New(endpoint.Config{
		URL: "https://raw.githubusercontent.com/axelrindle/private-dns-for-cloudflare/refs/heads/main/apps/desktop/updater/{{channel}}.json",
	})
	if err != nil {
		log.Printf("updater provider error: %v", err)
		return err
	}

	err = app.Updater.Init(updater.Config{
		CurrentVersion: "GET FROM BUILD INFO",
		Providers:      []updater.Provider{updateManifest},
		Channel:        "stable",
	})
	if err != nil {
		log.Printf("updater init error: %v", err)
		return err
	}

	err = app.Updater.CheckAndInstall(context.Background())
	if err != nil {
		log.Printf("updater install error: %v", err)
		return err
	}

	return nil
}
