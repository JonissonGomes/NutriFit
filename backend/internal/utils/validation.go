package utils

import (
	"fmt"
	"net/mail"
	"strings"
	"unicode/utf8"
)

const (
	MaxNameLen          = 100
	MaxEmailLen         = 255
	MaxPhoneDigits      = 11
	MaxPasswordLen      = 128
	MinPasswordLen      = 8
	MaxBioLen           = 500
	MaxMessageLen       = 5000
	MaxDescriptionLen   = 1000
	MaxServiceNameLen   = 100
	MaxServiceDuration  = 50
	MaxEventTitleLen    = 200
	MaxEventDescLen     = 2000
	MaxEventAddressLen  = 300
	MaxReviewCommentLen = 2000
	MinReviewCommentLen = 20
	MaxAIQuestionLen    = 1000
	MaxSearchQueryLen   = 100
)

func onlyDigits(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func ValidateName(name string) error {
	name = strings.TrimSpace(name)
	n := utf8.RuneCountInString(name)
	if n < 2 {
		return fmt.Errorf("nome deve ter pelo menos 2 caracteres")
	}
	if n > MaxNameLen {
		return fmt.Errorf("nome excede %d caracteres", MaxNameLen)
	}
	return nil
}

func ValidateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return fmt.Errorf("email é obrigatório")
	}
	if len(email) > MaxEmailLen {
		return fmt.Errorf("email excede %d caracteres", MaxEmailLen)
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return fmt.Errorf("email inválido")
	}
	return nil
}

func ValidatePassword(password string) error {
	if len(password) < MinPasswordLen {
		return fmt.Errorf("senha deve ter pelo menos %d caracteres", MinPasswordLen)
	}
	if len(password) > MaxPasswordLen {
		return fmt.Errorf("senha excede %d caracteres", MaxPasswordLen)
	}
	return nil
}

func ValidateOptionalPhone(phone string) error {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return nil
	}
	digits := onlyDigits(phone)
	if len(digits) < 10 || len(digits) > MaxPhoneDigits {
		return fmt.Errorf("telefone inválido")
	}
	return nil
}

func ValidateMaxRunes(value, field string, max int) error {
	if utf8.RuneCountInString(strings.TrimSpace(value)) > max {
		return fmt.Errorf("%s excede %d caracteres", field, max)
	}
	return nil
}

func ValidateReviewComment(comment string) error {
	comment = strings.TrimSpace(comment)
	n := utf8.RuneCountInString(comment)
	if n < MinReviewCommentLen {
		return fmt.Errorf("comentário deve ter pelo menos %d caracteres", MinReviewCommentLen)
	}
	if n > MaxReviewCommentLen {
		return fmt.Errorf("comentário excede %d caracteres", MaxReviewCommentLen)
	}
	return nil
}
