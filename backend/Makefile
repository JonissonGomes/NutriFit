.PHONY: run build test clean deps

run:
	go run cmd/server/main.go

build:
	go build -o server ./cmd/server

test:
	go test ./...

clean:
	rm -f server
	go clean

deps:
	go mod download
	go mod tidy

dev:
	ENV=development go run cmd/server/main.go



