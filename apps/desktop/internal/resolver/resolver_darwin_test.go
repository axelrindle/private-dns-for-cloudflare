package resolver

import "testing"

func TestContent(t *testing.T) {
	got := string(content(15353))
	want := "nameserver 127.0.0.1\nnameserver ::1\nport 15353\n"
	if got != want {
		t.Errorf("content() = %q, want %q", got, want)
	}
}

func TestQuote(t *testing.T) {
	got := quote("/tmp/it's here")
	want := `'/tmp/it'\''s here'`
	if got != want {
		t.Errorf("quote() = %s, want %s", got, want)
	}
}

func TestAppleScriptString(t *testing.T) {
	got := appleScriptString(`rm -f '/a "b"' \ c`)
	want := `"rm -f '/a \"b\"' \\ c"`
	if got != want {
		t.Errorf("appleScriptString() = %s, want %s", got, want)
	}
}
