package service

import (
	"encoding/json"

	"github.com/axelrindle/private-dns-for-cloudflare/internal/config"

	"github.com/zalando/go-keyring"
)

const configKey = "config"

type KeyringService struct {
	name string
}

func NewKeyringService(name string) *KeyringService {
	return &KeyringService{
		name,
	}
}

func (k KeyringService) Read(key string) (string, error) {
	v, err := keyring.Get(k.name, key)

	if err != nil {
		if err == keyring.ErrNotFound {
			return "", nil
		}

		return "", err
	}

	return v, nil
}

func (k KeyringService) Write(key string, value string) error {
	return keyring.Set(k.name, key, value)
}

func (k KeyringService) Reset() error {
	return keyring.DeleteAll(k.name)
}

// ReadConfig returns nil if no config has been stored yet.
func (k KeyringService) ReadConfig() (*config.Config, error) {
	v, err := k.Read(configKey)
	if err != nil || v == "" {
		return nil, err
	}

	var cfg config.Config
	if err := json.Unmarshal([]byte(v), &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func (k KeyringService) WriteConfig(cfg config.Config) error {
	if err := cfg.Validate(); err != nil {
		return err
	}

	v, err := json.Marshal(cfg)
	if err != nil {
		return err
	}

	return k.Write(configKey, string(v))
}
