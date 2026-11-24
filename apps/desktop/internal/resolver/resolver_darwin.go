package resolver

import (
	"bytes"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/axelrindle/private-dns-for-cloudflare/internal/config"
)

// See resolver(5). Files in this directory configure per-domain nameservers.
const resolverDir = "/etc/resolver"

func path(tld string) string {
	return filepath.Join(resolverDir, tld)
}

func content(port uint16) []byte {
	return fmt.Appendf(nil, "nameserver 127.0.0.1\nnameserver ::1\nport %d\n", port)
}

func apply(old *config.Config, cfg config.Config) error {
	want := content(cfg.Port)
	tldChanged := old != nil && old.Tld != "" && old.Tld != cfg.Tld

	// skip the password prompt if nothing changes
	have, err := os.ReadFile(path(cfg.Tld))
	if err == nil && bytes.Equal(have, want) && !tldChanged {
		return nil
	}

	// the file is written as the current user, root only copies it into place
	tmp, err := os.CreateTemp("", "resolver-*")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())

	if _, err := tmp.Write(want); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}

	cmds := []string{
		"mkdir -p " + quote(resolverDir),
		"install -m 644 " + quote(tmp.Name()) + " " + quote(path(cfg.Tld)),
	}
	if tldChanged {
		cmds = append(cmds, "rm -f "+quote(path(old.Tld)))
	}

	return runAsAdmin(strings.Join(cmds, " && "))
}

func remove(tld string) error {
	// skip the password prompt if there is nothing to delete
	if _, err := os.Stat(path(tld)); errors.Is(err, fs.ErrNotExist) {
		return nil
	}

	return runAsAdmin("rm -f " + quote(path(tld)))
}

// runAsAdmin runs a shell script as root after the user confirms the macOS
// admin password prompt.
func runAsAdmin(script string) error {
	as := fmt.Sprintf("do shell script %s with administrator privileges", appleScriptString(script))

	out, err := exec.Command("osascript", "-e", as).CombinedOutput()
	if err != nil {
		// -128 is AppleScript's "User canceled."
		if bytes.Contains(out, []byte("(-128)")) {
			return ErrCanceled
		}
		return fmt.Errorf("resolver setup failed: %s", bytes.TrimSpace(out))
	}

	return nil
}

// quote wraps s in single quotes for sh.
func quote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}

// appleScriptString turns s into an AppleScript string literal.
func appleScriptString(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `"`, `\"`)
	return `"` + s + `"`
}
