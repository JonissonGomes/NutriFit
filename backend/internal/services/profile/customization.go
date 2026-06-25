package profile

import (
	"encoding/json"

	"nufit/backend/internal/models"
)

func defaultCustomization() models.ProfileCustomization {
	return models.ProfileCustomization{
		PageStyle:        models.PageStyleBlocks,
		Layout:           models.LayoutGrid,
		GridColumns:      3,
		ShowStats:        true,
		ShowServices:     true,
		ShowReviews:      true,
		ShowContact:      true,
		ShowContents:     true,
		ShowRecipes:      true,
		ShowBio:          true,
		ShowEducation:    true,
		ShowExperience:   true,
		ShowAwards:       true,
		Show3DModels:     false,
		BackgroundStyle:  "light",
		HeroStyle:        "full",
		ProjectCardStyle: "simple",
	}
}

// NormalizeCustomization aplica defaults para perfis antigos ou campos ausentes.
func NormalizeCustomization(c *models.ProfileCustomization) *models.ProfileCustomization {
	def := defaultCustomization()
	if c == nil {
		out := def
		return &out
	}

	out := *c
	if out.PageStyle == "" {
		out.PageStyle = def.PageStyle
	}
	if out.Layout == "" {
		out.Layout = def.Layout
	}
	if out.GridColumns <= 0 {
		out.GridColumns = def.GridColumns
	}
	if out.BackgroundStyle == "" {
		out.BackgroundStyle = def.BackgroundStyle
	}
	if out.HeroStyle == "" {
		out.HeroStyle = def.HeroStyle
	}
	if out.ProjectCardStyle == "" {
		out.ProjectCardStyle = def.ProjectCardStyle
	}
	return &out
}

func applyCustomizationToProfile(p *models.PublicProfile) {
	if p == nil {
		return
	}
	p.Customization = NormalizeCustomization(p.Customization)
}

// ParseCustomizationUpdate decodifica o payload JSON em struct tipada antes de persistir.
func ParseCustomizationUpdate(raw interface{}) (*models.ProfileCustomization, error) {
	if raw == nil {
		out := defaultCustomization()
		return &out, nil
	}

	data, err := json.Marshal(raw)
	if err != nil {
		return nil, err
	}

	var parsed models.ProfileCustomization
	if err := json.Unmarshal(data, &parsed); err != nil {
		return nil, err
	}

	return NormalizeCustomization(&parsed), nil
}
