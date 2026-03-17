package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================
// TIPOS E CONSTANTES
// ============================================

// BadgeType define o tipo de badge
type BadgeType string

const (
	BadgeTypeVerified       BadgeType = "verified"        // Profissional verificado
	BadgeTypeTopRated       BadgeType = "top_rated"       // Avaliação excelente
	BadgeTypePopular        BadgeType = "popular"         // Muitos seguidores/favoritos
	BadgeTypeExpert         BadgeType = "expert"          // Muitas respostas aceitas
	BadgeTypeProlific       BadgeType = "prolific"        // Muitos projetos
	BadgeTypeBlogger        BadgeType = "blogger"         // Criador de conteúdo
	BadgeTypeResponsive     BadgeType = "responsive"      // Responde rapidamente
	BadgeTypePioneer        BadgeType = "pioneer"         // Usuário pioneiro
	BadgeTypeContributor    BadgeType = "contributor"     // Contribuidor da comunidade
	BadgeTypeMilestone      BadgeType = "milestone"       // Marcos importantes
	BadgeTypeSeasonal       BadgeType = "seasonal"        // Eventos sazonais
	BadgeTypePremium        BadgeType = "premium"         // Usuário premium
)

// BadgeLevel define o nível do badge
type BadgeLevel string

const (
	BadgeLevelBronze   BadgeLevel = "bronze"
	BadgeLevelSilver   BadgeLevel = "silver"
	BadgeLevelGold     BadgeLevel = "gold"
	BadgeLevelPlatinum BadgeLevel = "platinum"
	BadgeLevelDiamond  BadgeLevel = "diamond"
)

// ============================================
// ESTRUTURAS DE DADOS
// ============================================

// BadgeDefinition define um tipo de badge disponível no sistema
type BadgeDefinition struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Type        BadgeType          `bson:"type" json:"type"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Icon        string             `bson:"icon" json:"icon"`                   // Emoji ou URL do ícone
	Color       string             `bson:"color" json:"color"`                 // Cor do badge (hex)
	Level       BadgeLevel         `bson:"level" json:"level"`
	Criteria    BadgeCriteria      `bson:"criteria" json:"criteria"`           // Critérios para conquistar
	Points      int                `bson:"points" json:"points"`               // Pontos que o badge vale
	IsActive    bool               `bson:"isActive" json:"isActive"`           // Se o badge está ativo
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
}

// BadgeCriteria define os critérios para conquistar um badge
type BadgeCriteria struct {
	MinProjects      int     `bson:"minProjects,omitempty" json:"minProjects,omitempty"`
	MinReviews       int     `bson:"minReviews,omitempty" json:"minReviews,omitempty"`
	MinRating        float64 `bson:"minRating,omitempty" json:"minRating,omitempty"`
	MinFavorites     int     `bson:"minFavorites,omitempty" json:"minFavorites,omitempty"`
	MinAnswers       int     `bson:"minAnswers,omitempty" json:"minAnswers,omitempty"`
	MinBestAnswers   int     `bson:"minBestAnswers,omitempty" json:"minBestAnswers,omitempty"`
	MinBlogPosts     int     `bson:"minBlogPosts,omitempty" json:"minBlogPosts,omitempty"`
	MinResponseTime  int     `bson:"minResponseTime,omitempty" json:"minResponseTime,omitempty"`   // em minutos
	MinDaysActive    int     `bson:"minDaysActive,omitempty" json:"minDaysActive,omitempty"`
	RequireVerified  bool    `bson:"requireVerified,omitempty" json:"requireVerified,omitempty"`
	RequirePremium   bool    `bson:"requirePremium,omitempty" json:"requirePremium,omitempty"`
}

// UserBadge representa um badge conquistado por um usuário
type UserBadge struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID       primitive.ObjectID `bson:"userId" json:"userId"`
	BadgeID      primitive.ObjectID `bson:"badgeId" json:"badgeId"`
	Badge        *BadgeDefinition   `bson:"badge,omitempty" json:"badge,omitempty"`       // Populado na consulta
	AwardedAt    time.Time          `bson:"awardedAt" json:"awardedAt"`
	AwardedBy    *primitive.ObjectID `bson:"awardedBy,omitempty" json:"awardedBy,omitempty"` // Se concedido manualmente
	Reason       string             `bson:"reason,omitempty" json:"reason,omitempty"`     // Motivo (se manual)
	IsDisplayed  bool               `bson:"isDisplayed" json:"isDisplayed"`               // Se está sendo exibido no perfil
	DisplayOrder int                `bson:"displayOrder" json:"displayOrder"`             // Ordem de exibição
}

// UserBadgeSummary representa um resumo de badges de um usuário
type UserBadgeSummary struct {
	TotalBadges int           `json:"totalBadges"`
	TotalPoints int           `json:"totalPoints"`
	Badges      []UserBadge   `json:"badges"`
	Featured    []UserBadge   `json:"featured"`   // Badges em destaque (exibidos)
	ByLevel     map[BadgeLevel]int `json:"byLevel"` // Contagem por nível
}

// BadgeProgress representa o progresso de um usuário em direção a um badge
type BadgeProgress struct {
	Badge           BadgeDefinition `json:"badge"`
	IsUnlocked      bool            `json:"isUnlocked"`
	Progress        float64         `json:"progress"`        // Porcentagem de progresso (0-100)
	CurrentValue    int             `json:"currentValue"`    // Valor atual
	RequiredValue   int             `json:"requiredValue"`   // Valor necessário
	RemainingValue  int             `json:"remainingValue"`  // Quanto falta
	NextMilestone   string          `json:"nextMilestone"`   // Descrição do próximo marco
}

// ============================================
// BADGES PRÉ-DEFINIDOS
// ============================================

// GetDefaultBadgeDefinitions retorna as definições padrão de badges
func GetDefaultBadgeDefinitions() []BadgeDefinition {
	return []BadgeDefinition{
		// Verificação
		{
			Type:        BadgeTypeVerified,
			Name:        "Profissional Verificado",
			Description: "Profissional com identidade e qualificações verificadas",
			Icon:        "✓",
			Color:       "#4CAF50",
			Level:       BadgeLevelGold,
			Criteria:    BadgeCriteria{RequireVerified: true},
			Points:      100,
			IsActive:    true,
		},
		// Avaliações
		{
			Type:        BadgeTypeTopRated,
			Name:        "Excelente Reputação",
			Description: "Média de avaliações acima de 4.5 estrelas",
			Icon:        "⭐",
			Color:       "#FFC107",
			Level:       BadgeLevelGold,
			Criteria:    BadgeCriteria{MinRating: 4.5, MinReviews: 10},
			Points:      50,
			IsActive:    true,
		},
		{
			Type:        BadgeTypeTopRated,
			Name:        "Bem Avaliado",
			Description: "Média de avaliações acima de 4.0 estrelas",
			Icon:        "👍",
			Color:       "#4CAF50",
			Level:       BadgeLevelSilver,
			Criteria:    BadgeCriteria{MinRating: 4.0, MinReviews: 5},
			Points:      25,
			IsActive:    true,
		},
		// Popularidade
		{
			Type:        BadgeTypePopular,
			Name:        "Popular",
			Description: "Mais de 50 pessoas adicionaram aos favoritos",
			Icon:        "❤️",
			Color:       "#E91E63",
			Level:       BadgeLevelGold,
			Criteria:    BadgeCriteria{MinFavorites: 50},
			Points:      50,
			IsActive:    true,
		},
		{
			Type:        BadgeTypePopular,
			Name:        "Em Alta",
			Description: "Mais de 20 pessoas adicionaram aos favoritos",
			Icon:        "💗",
			Color:       "#FF4081",
			Level:       BadgeLevelSilver,
			Criteria:    BadgeCriteria{MinFavorites: 20},
			Points:      25,
			IsActive:    true,
		},
		// Projetos
		{
			Type:        BadgeTypeProlific,
			Name:        "Portfólio Extenso",
			Description: "Mais de 20 projetos publicados",
			Icon:        "🏆",
			Color:       "#9C27B0",
			Level:       BadgeLevelGold,
			Criteria:    BadgeCriteria{MinProjects: 20},
			Points:      50,
			IsActive:    true,
		},
		{
			Type:        BadgeTypeProlific,
			Name:        "Prolífico",
			Description: "Mais de 10 projetos publicados",
			Icon:        "🏅",
			Color:       "#673AB7",
			Level:       BadgeLevelSilver,
			Criteria:    BadgeCriteria{MinProjects: 10},
			Points:      25,
			IsActive:    true,
		},
		{
			Type:        BadgeTypeProlific,
			Name:        "Primeiros Passos",
			Description: "Publicou 5 projetos",
			Icon:        "📁",
			Color:       "#3F51B5",
			Level:       BadgeLevelBronze,
			Criteria:    BadgeCriteria{MinProjects: 5},
			Points:      10,
			IsActive:    true,
		},
		// Especialista em perguntas
		{
			Type:        BadgeTypeExpert,
			Name:        "Especialista",
			Description: "Mais de 10 respostas marcadas como melhor",
			Icon:        "🎓",
			Color:       "#2196F3",
			Level:       BadgeLevelGold,
			Criteria:    BadgeCriteria{MinBestAnswers: 10},
			Points:      75,
			IsActive:    true,
		},
		{
			Type:        BadgeTypeExpert,
			Name:        "Consultivo",
			Description: "Mais de 20 respostas em perguntas",
			Icon:        "💬",
			Color:       "#03A9F4",
			Level:       BadgeLevelSilver,
			Criteria:    BadgeCriteria{MinAnswers: 20},
			Points:      30,
			IsActive:    true,
		},
		// Criador de conteúdo
		{
			Type:        BadgeTypeBlogger,
			Name:        "Influenciador",
			Description: "Mais de 10 posts de blog publicados",
			Icon:        "✍️",
			Color:       "#FF5722",
			Level:       BadgeLevelGold,
			Criteria:    BadgeCriteria{MinBlogPosts: 10},
			Points:      50,
			IsActive:    true,
		},
		{
			Type:        BadgeTypeBlogger,
			Name:        "Blogger",
			Description: "Publicou 5 posts de blog",
			Icon:        "📝",
			Color:       "#FF9800",
			Level:       BadgeLevelSilver,
			Criteria:    BadgeCriteria{MinBlogPosts: 5},
			Points:      25,
			IsActive:    true,
		},
		// Responsividade
		{
			Type:        BadgeTypeResponsive,
			Name:        "Resposta Rápida",
			Description: "Responde mensagens em menos de 2 horas em média",
			Icon:        "⚡",
			Color:       "#00BCD4",
			Level:       BadgeLevelGold,
			Criteria:    BadgeCriteria{MinResponseTime: 120},
			Points:      40,
			IsActive:    true,
		},
		// Premium
		{
			Type:        BadgeTypePremium,
			Name:        "Profissional Premium",
			Description: "Assinante do plano premium",
			Icon:        "💎",
			Color:       "#9C27B0",
			Level:       BadgeLevelPlatinum,
			Criteria:    BadgeCriteria{RequirePremium: true},
			Points:      100,
			IsActive:    true,
		},
	}
}



