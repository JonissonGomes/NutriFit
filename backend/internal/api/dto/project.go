package dto

import (
	"time"

	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/security"
)

// ============================================
// DTOs PARA PROJETOS
// ============================================

// ProjectResponse é a resposta pública de um projeto
type ProjectResponse struct {
	Token       string            `json:"id"`
	Title       string            `json:"title"`
	Description string            `json:"description,omitempty"`
	Category    string            `json:"category"`
	Location    string            `json:"location,omitempty"`
	Status      string            `json:"status"`
	AccessType  string            `json:"accessType"`
	CoverImage  string            `json:"coverImage,omitempty"`
	Tags        []string          `json:"tags,omitempty"`
	Specs       map[string]string `json:"specs,omitempty"`
	Views       int               `json:"views"`
	FilesCount  int               `json:"filesCount"`
	Featured    bool              `json:"featured"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// NewProjectResponse cria uma resposta segura de projeto
func NewProjectResponse(project *models.Project) ProjectResponse {
	token, _ := security.EncodeProjectID(project.ID.Hex())
	
	specs := make(map[string]string)
	if project.Specs != nil {
		if project.Specs.Area != "" {
			specs["area"] = project.Specs.Area
		}
		if project.Specs.Garage != "" {
			specs["garage"] = project.Specs.Garage
		}
		if project.Specs.Style != "" {
			specs["style"] = project.Specs.Style
		}
	}
	
	return ProjectResponse{
		Token:       token,
		Title:       project.Title,
		Description: project.Description,
		Category:    string(project.Category),
		Location:    project.Location,
		Status:      string(project.Status),
		AccessType:  string(project.AccessType),
		CoverImage:  project.CoverImage,
		Tags:        project.Tags,
		Specs:       specs,
		Views:       project.Views,
		FilesCount:  project.FilesCount,
		Featured:    project.Featured,
		CreatedAt:   project.CreatedAt,
		UpdatedAt:   project.UpdatedAt,
	}
}

// NewProjectListResponse cria uma lista de respostas de projetos
func NewProjectListResponse(projects []*models.Project) []ProjectResponse {
	result := make([]ProjectResponse, len(projects))
	for i, p := range projects {
		result[i] = NewProjectResponse(p)
	}
	return result
}

// ProjectListResponse é a resposta paginada de projetos
type ProjectListResponse struct {
	Data       []ProjectResponse `json:"data"`
	Total      int               `json:"total"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalPages int               `json:"totalPages"`
}

// NewProjectListPaginatedResponse cria uma resposta paginada
func NewProjectListPaginatedResponse(projects []*models.Project, total, page, limit int) ProjectListResponse {
	totalPages := (total + limit - 1) / limit
	return ProjectListResponse{
		Data:       NewProjectListResponse(projects),
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}



