package service

import "github.com/wailsapp/wails/v3/pkg/application"

type AutostartService struct {
}

func (a AutostartService) IsEnabled() (bool, error) {
	return application.Get().Autostart.IsEnabled()
}

func (a AutostartService) Enable() error {
	return application.Get().Autostart.Enable()
}

func (a AutostartService) Disable() error {
	return application.Get().Autostart.Disable()
}
