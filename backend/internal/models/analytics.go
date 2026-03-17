package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================
// TIPOS E CONSTANTES
// ============================================

// AnalyticsEventType define o tipo de evento de analytics
type AnalyticsEventType string

const (
	AnalyticsEventProfileView      AnalyticsEventType = "profile_view"
	AnalyticsEventProjectView      AnalyticsEventType = "project_view"
	AnalyticsEventContactClick     AnalyticsEventType = "contact_click"
	AnalyticsEventWebsiteClick     AnalyticsEventType = "website_click"
	AnalyticsEventSocialClick      AnalyticsEventType = "social_click"
	AnalyticsEventFavoriteAdd      AnalyticsEventType = "favorite_add"
	AnalyticsEventFavoriteRemove   AnalyticsEventType = "favorite_remove"
	AnalyticsEventMessageSent      AnalyticsEventType = "message_sent"
	AnalyticsEventServiceView      AnalyticsEventType = "service_view"
	AnalyticsEventBlogPostView     AnalyticsEventType = "blog_post_view"
	AnalyticsEventQuestionView     AnalyticsEventType = "question_view"
	AnalyticsEventSearchAppearance AnalyticsEventType = "search_appearance"
	AnalyticsEventSearchClick      AnalyticsEventType = "search_click"
)

// AnalyticsSource define a origem do tráfego
type AnalyticsSource string

const (
	AnalyticsSourceDirect       AnalyticsSource = "direct"
	AnalyticsSourceSearch       AnalyticsSource = "search"
	AnalyticsSourceSocial       AnalyticsSource = "social"
	AnalyticsSourceReferral     AnalyticsSource = "referral"
	AnalyticsSourceEmail        AnalyticsSource = "email"
	AnalyticsSourcePaid         AnalyticsSource = "paid"
	AnalyticsSourceInternal     AnalyticsSource = "internal"
)

// ============================================
// ESTRUTURAS DE DADOS
// ============================================

// AnalyticsEvent representa um evento de analytics
type AnalyticsEvent struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID      primitive.ObjectID `bson:"userId" json:"userId"`                                 // ID do dono do perfil/conteúdo
	VisitorID   string             `bson:"visitorId,omitempty" json:"visitorId,omitempty"`       // ID do visitante (anônimo ou logado)
	VisitorRole string             `bson:"visitorRole,omitempty" json:"visitorRole,omitempty"`   // Role do visitante se logado
	EventType   AnalyticsEventType `bson:"eventType" json:"eventType"`
	TargetID    string             `bson:"targetId,omitempty" json:"targetId,omitempty"`         // ID do item visualizado (projeto, post, etc)
	TargetType  string             `bson:"targetType,omitempty" json:"targetType,omitempty"`     // Tipo do item (project, blog_post, etc)
	Source      AnalyticsSource    `bson:"source,omitempty" json:"source,omitempty"`
	Referrer    string             `bson:"referrer,omitempty" json:"referrer,omitempty"`
	UserAgent   string             `bson:"userAgent,omitempty" json:"userAgent,omitempty"`
	DeviceType  string             `bson:"deviceType,omitempty" json:"deviceType,omitempty"`     // desktop, mobile, tablet
	Country     string             `bson:"country,omitempty" json:"country,omitempty"`
	City        string             `bson:"city,omitempty" json:"city,omitempty"`
	SearchQuery string             `bson:"searchQuery,omitempty" json:"searchQuery,omitempty"`   // Query de busca se veio de pesquisa
	Metadata    map[string]any     `bson:"metadata,omitempty" json:"metadata,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
}

// AnalyticsSummary representa um resumo de analytics para um período
type AnalyticsSummary struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID         primitive.ObjectID `bson:"userId" json:"userId"`
	Period         string             `bson:"period" json:"period"`                 // daily, weekly, monthly
	Date           time.Time          `bson:"date" json:"date"`                     // Data de referência do período
	ProfileViews   int64              `bson:"profileViews" json:"profileViews"`
	ProjectViews   int64              `bson:"projectViews" json:"projectViews"`
	ContactClicks  int64              `bson:"contactClicks" json:"contactClicks"`
	WebsiteClicks  int64              `bson:"websiteClicks" json:"websiteClicks"`
	SocialClicks   int64              `bson:"socialClicks" json:"socialClicks"`
	FavoritesAdded int64              `bson:"favoritesAdded" json:"favoritesAdded"`
	MessagesSent   int64              `bson:"messagesSent" json:"messagesSent"`
	ServiceViews   int64              `bson:"serviceViews" json:"serviceViews"`
	BlogPostViews  int64              `bson:"blogPostViews" json:"blogPostViews"`
	SearchAppears  int64              `bson:"searchAppears" json:"searchAppears"`
	SearchClicks   int64              `bson:"searchClicks" json:"searchClicks"`
	UniqueVisitors int64              `bson:"uniqueVisitors" json:"uniqueVisitors"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// AnalyticsOverview representa uma visão geral de analytics
type AnalyticsOverview struct {
	TotalProfileViews   int64                `json:"totalProfileViews"`
	TotalProjectViews   int64                `json:"totalProjectViews"`
	TotalContactClicks  int64                `json:"totalContactClicks"`
	TotalUniqueVisitors int64                `json:"totalUniqueVisitors"`
	TotalFavorites      int64                `json:"totalFavorites"`
	TotalMessages       int64                `json:"totalMessages"`
	SearchAppearances   int64                `json:"searchAppearances"`
	EngagementRate      float64              `json:"engagementRate"`      // (clicks + messages) / views
	SourceBreakdown     []SourceStat         `json:"sourceBreakdown"`
	DeviceBreakdown     []DeviceStat         `json:"deviceBreakdown"`
	TopProjects         []ProjectAnalytics   `json:"topProjects"`
	LocationBreakdown   []LocationStat       `json:"locationBreakdown"`
	DailyTrend          []DailyAnalyticsStat `json:"dailyTrend"`
}

// SourceStat representa estatísticas por fonte
type SourceStat struct {
	Source AnalyticsSource `json:"source"`
	Count  int64           `json:"count"`
	Percent float64        `json:"percent"`
}

// DeviceStat representa estatísticas por dispositivo
type DeviceStat struct {
	Device  string  `json:"device"`
	Count   int64   `json:"count"`
	Percent float64 `json:"percent"`
}

// LocationStat representa estatísticas por localização
type LocationStat struct {
	Country string  `json:"country"`
	City    string  `json:"city,omitempty"`
	Count   int64   `json:"count"`
	Percent float64 `json:"percent"`
}

// ProjectAnalytics representa analytics de um projeto
type ProjectAnalytics struct {
	ProjectID string `json:"projectId"`
	Title     string `json:"title"`
	Views     int64  `json:"views"`
	Clicks    int64  `json:"clicks"`
}

// DailyAnalyticsStat representa estatísticas diárias
type DailyAnalyticsStat struct {
	Date          string `json:"date"`
	ProfileViews  int64  `json:"profileViews"`
	ProjectViews  int64  `json:"projectViews"`
	ContactClicks int64  `json:"contactClicks"`
	Messages      int64  `json:"messages"`
}

// ============================================
// FILTROS E REQUESTS
// ============================================

// AnalyticsFilters define os filtros para consulta de analytics
type AnalyticsFilters struct {
	StartDate  time.Time          `json:"startDate"`
	EndDate    time.Time          `json:"endDate"`
	EventTypes []AnalyticsEventType `json:"eventTypes,omitempty"`
	Sources    []AnalyticsSource  `json:"sources,omitempty"`
	TargetID   string             `json:"targetId,omitempty"`
	Period     string             `json:"period,omitempty"` // daily, weekly, monthly
}

// TrackEventRequest representa uma requisição para rastrear um evento
type TrackEventRequest struct {
	UserID      string             `json:"userId" binding:"required"`
	EventType   AnalyticsEventType `json:"eventType" binding:"required"`
	TargetID    string             `json:"targetId,omitempty"`
	TargetType  string             `json:"targetType,omitempty"`
	Source      AnalyticsSource    `json:"source,omitempty"`
	Referrer    string             `json:"referrer,omitempty"`
	SearchQuery string             `json:"searchQuery,omitempty"`
	Metadata    map[string]any     `json:"metadata,omitempty"`
}

// ComparisonStats representa estatísticas de comparação entre períodos
type ComparisonStats struct {
	Current     AnalyticsOverview `json:"current"`
	Previous    AnalyticsOverview `json:"previous"`
	Changes     PercentageChanges `json:"changes"`
}

// PercentageChanges representa as mudanças percentuais entre períodos
type PercentageChanges struct {
	ProfileViews   float64 `json:"profileViews"`
	ProjectViews   float64 `json:"projectViews"`
	ContactClicks  float64 `json:"contactClicks"`
	UniqueVisitors float64 `json:"uniqueVisitors"`
	Favorites      float64 `json:"favorites"`
	Messages       float64 `json:"messages"`
}



