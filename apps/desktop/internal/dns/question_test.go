package dns

import "testing"

func TestQuestionType(t *testing.T) {
	// header (1 question) + example.com + AAAA + IN
	msg := []byte{
		0x12, 0x34, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		7, 'e', 'x', 'a', 'm', 'p', 'l', 'e', 3, 'c', 'o', 'm', 0,
		0x00, 0x1c, 0x00, 0x01,
	}

	if qt, ok := questionType(msg); !ok || qt != 28 {
		t.Errorf("expected 28, got %d (ok=%v)", qt, ok)
	}

	for _, n := range []int{0, 11, 20, 26} {
		if _, ok := questionType(msg[:n]); ok {
			t.Errorf("expected failure for truncated message of length %d", n)
		}
	}
}
