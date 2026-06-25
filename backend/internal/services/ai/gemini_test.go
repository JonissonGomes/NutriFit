package ai

import "testing"

func TestIsModelNotFoundResponse(t *testing.T) {
	bodyDeprecated := []byte(`{"error":{"message":"This model models/gemini-2.0-flash is no longer available.","status":"NOT_FOUND"}}`)
	if !isModelNotFoundResponse(404, bodyDeprecated) {
		t.Fatal("expected deprecated model 404 to be treated as model not found")
	}

	bodyClassic := []byte(`{"error":{"message":"models/gemini-1.5-flash is not found","status":"NOT_FOUND"}}`)
	if !isModelNotFoundResponse(404, bodyClassic) {
		t.Fatal("expected classic not found message to match")
	}

	if isModelNotFoundResponse(403, bodyDeprecated) {
		t.Fatal("expected non-404 status to not match")
	}
}
