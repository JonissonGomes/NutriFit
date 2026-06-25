package blog

import (
	"strings"
	"unicode/utf8"
)

const (
	TitleMin   = 5
	TitleMax   = 80
	ExcerptMin = 20
	ExcerptMax = 320
	ContentMin = 80
	ContentMax = 2000
)

func textLength(s string) int {
	return utf8.RuneCountInString(strings.TrimSpace(s))
}

func validateTitle(title string) bool {
	n := textLength(title)
	return n >= TitleMin && n <= TitleMax
}

func validateExcerpt(excerpt string) bool {
	n := textLength(excerpt)
	return n >= ExcerptMin && n <= ExcerptMax
}

func validateContent(content string) bool {
	n := textLength(content)
	return n >= ContentMin && n <= ContentMax
}
