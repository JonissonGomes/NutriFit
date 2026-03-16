package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// BlogCategory representa a categoria de um post do blog
type BlogCategory string

const (
	BlogCategorySustentabilidade BlogCategory = "sustentabilidade"
	BlogCategoryTendencias       BlogCategory = "tendencias"
	BlogCategoryDicas            BlogCategory = "dicas"
	BlogCategoryProjetos         BlogCategory = "projetos"
	BlogCategoryMateriais        BlogCategory = "materiais"
	BlogCategoryInteriores       BlogCategory = "interiores"
	BlogCategoryReforma          BlogCategory = "reforma"
	BlogCategoryNoticias         BlogCategory = "noticias"
)

// BlogPostSEO representa os metadados de SEO de um post
type BlogPostSEO struct {
	MetaTitle       string   `bson:"metaTitle,omitempty" json:"metaTitle,omitempty"`
	MetaDescription string   `bson:"metaDescription,omitempty" json:"metaDescription,omitempty"`
	Keywords        []string `bson:"keywords,omitempty" json:"keywords,omitempty"`
	CanonicalURL    string   `bson:"canonicalUrl,omitempty" json:"canonicalUrl,omitempty"`
}

// BlogPostAuthor representa informações resumidas do autor
type BlogPostAuthor struct {
	ID          primitive.ObjectID `bson:"id" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Avatar      string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	Specialty   string             `bson:"specialty,omitempty" json:"specialty,omitempty"`
	Username    string             `bson:"username,omitempty" json:"username,omitempty"`
}

// BlogPost representa um post do blog
type BlogPost struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	AuthorID      primitive.ObjectID `bson:"authorId" json:"authorId"`
	Author        *BlogPostAuthor    `bson:"author,omitempty" json:"author,omitempty"`
	Title         string             `bson:"title" json:"title"`
	Slug          string             `bson:"slug" json:"slug"`
	Excerpt       string             `bson:"excerpt" json:"excerpt"`
	Content       string             `bson:"content" json:"content"`
	FeaturedImage string             `bson:"featuredImage,omitempty" json:"featuredImage,omitempty"`
	Category      BlogCategory       `bson:"category" json:"category"`
	Tags          []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	Published     bool               `bson:"published" json:"published"`
	PublishedAt   *time.Time         `bson:"publishedAt,omitempty" json:"publishedAt,omitempty"`
	Views         int                `bson:"views" json:"views"`
	Likes         int                `bson:"likes" json:"likes"`
	LikedBy       []primitive.ObjectID `bson:"likedBy,omitempty" json:"-"`
	CommentsCount int                `bson:"commentsCount" json:"commentsCount"`
	SEO           BlogPostSEO        `bson:"seo,omitempty" json:"seo,omitempty"`
	Featured      bool               `bson:"featured" json:"featured"`
	ReadTime      int                `bson:"readTime" json:"readTime"` // minutos
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// BlogComment representa um comentário em um post
type BlogComment struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PostID    primitive.ObjectID `bson:"postId" json:"postId"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	UserName  string             `bson:"userName" json:"userName"`
	UserAvatar string            `bson:"userAvatar,omitempty" json:"userAvatar,omitempty"`
	Content   string             `bson:"content" json:"content"`
	Likes     int                `bson:"likes" json:"likes"`
	LikedBy   []primitive.ObjectID `bson:"likedBy,omitempty" json:"-"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// CreateBlogPostRequest representa a requisição para criar um post
type CreateBlogPostRequest struct {
	Title         string       `json:"title" binding:"required,min=5,max=200"`
	Excerpt       string       `json:"excerpt" binding:"required,min=10,max=500"`
	Content       string       `json:"content" binding:"required,min=100"`
	FeaturedImage string       `json:"featuredImage,omitempty"`
	Category      BlogCategory `json:"category" binding:"required"`
	Tags          []string     `json:"tags,omitempty"`
	Published     bool         `json:"published"`
	SEO           BlogPostSEO  `json:"seo,omitempty"`
}

// UpdateBlogPostRequest representa a requisição para atualizar um post
type UpdateBlogPostRequest struct {
	Title         string       `json:"title,omitempty"`
	Excerpt       string       `json:"excerpt,omitempty"`
	Content       string       `json:"content,omitempty"`
	FeaturedImage string       `json:"featuredImage,omitempty"`
	Category      BlogCategory `json:"category,omitempty"`
	Tags          []string     `json:"tags,omitempty"`
	Published     *bool        `json:"published,omitempty"`
	SEO           *BlogPostSEO `json:"seo,omitempty"`
}

// BlogPostFilters representa os filtros para buscar posts
type BlogPostFilters struct {
	Category  BlogCategory `form:"category"`
	AuthorID  string       `form:"authorId"`
	Tag       string       `form:"tag"`
	Search    string       `form:"search"`
	Published *bool        `form:"published"`
	Featured  *bool        `form:"featured"`
	Page      int          `form:"page,default=1"`
	Limit     int          `form:"limit,default=20"`
}

// BlogPostListResponse representa a resposta paginada de posts
type BlogPostListResponse struct {
	Data       []BlogPost `json:"data"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	Limit      int        `json:"limit"`
	TotalPages int        `json:"totalPages"`
}

// BlogCategoryInfo representa informações sobre uma categoria
type BlogCategoryInfo struct {
	Value       BlogCategory `json:"value"`
	Label       string       `json:"label"`
	Description string       `json:"description"`
	PostCount   int64        `json:"postCount"`
}

// BlogStats representa estatísticas do blog
type BlogStats struct {
	TotalPosts     int64 `json:"totalPosts"`
	PublishedPosts int64 `json:"publishedPosts"`
	DraftPosts     int64 `json:"draftPosts"`
	TotalViews     int64 `json:"totalViews"`
	TotalLikes     int64 `json:"totalLikes"`
	TotalComments  int64 `json:"totalComments"`
	MyPosts        int64 `json:"myPosts,omitempty"`
}



