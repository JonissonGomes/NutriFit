package blog

import (
	"context"
	"errors"
	"math"
	"regexp"
	"strings"
	"time"
	"unicode"

	"nufit/backend/internal/database"
	"nufit/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ============================================
// ERROS
// ============================================

var (
	ErrPostNotFound     = errors.New("post não encontrado")
	ErrUnauthorized     = errors.New("não autorizado")
	ErrSlugAlreadyExists = errors.New("slug já existe")
	ErrAlreadyLiked     = errors.New("você já curtiu este post")
)

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// generateSlug gera um slug a partir de um título
func generateSlug(title string) string {
	// Converter para minúsculas
	slug := strings.ToLower(title)

	// Remover acentos (simplificado)
	replacements := map[rune]rune{
		'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
		'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
		'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
		'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
		'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
		'ç': 'c', 'ñ': 'n',
	}

	var result strings.Builder
	for _, r := range slug {
		if replacement, ok := replacements[r]; ok {
			result.WriteRune(replacement)
		} else if unicode.IsLetter(r) || unicode.IsDigit(r) || r == ' ' || r == '-' {
			result.WriteRune(r)
		}
	}
	slug = result.String()

	// Substituir espaços por hífens
	slug = strings.ReplaceAll(slug, " ", "-")

	// Remover hífens múltiplos
	reg := regexp.MustCompile(`-+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Remover hífens no início e fim
	slug = strings.Trim(slug, "-")

	return slug
}

// calculateReadTime calcula o tempo de leitura em minutos
func calculateReadTime(content string) int {
	// Média de 200 palavras por minuto
	words := len(strings.Fields(content))
	readTime := words / 200
	if readTime < 1 {
		readTime = 1
	}
	return readTime
}

// ============================================
// FUNÇÕES DE BLOG
// ============================================

// ListPosts lista posts com filtros
func ListPosts(ctx context.Context, filters models.BlogPostFilters) (*models.BlogPostListResponse, error) {
	filter := bson.M{}

	if filters.Category != "" {
		filter["category"] = filters.Category
	}

	if filters.AuthorID != "" {
		if oid, err := primitive.ObjectIDFromHex(filters.AuthorID); err == nil {
			filter["authorId"] = oid
		}
	}

	if filters.Tag != "" {
		filter["tags"] = filters.Tag
	}

	if filters.Published != nil {
		filter["published"] = *filters.Published
	}

	if filters.Featured != nil {
		filter["featured"] = *filters.Featured
	}

	if filters.Search != "" {
		filter["$or"] = []bson.M{
			{"title": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"excerpt": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"content": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"tags": bson.M{"$regex": filters.Search, "$options": "i"}},
		}
	}

	// Contagem total
	total, err := database.BlogPostsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}

	// Paginação
	page := filters.Page
	if page < 1 {
		page = 1
	}
	limit := filters.Limit
	if limit < 1 || limit > 100 {
		limit = 20
	}
	skip := (page - 1) * limit

	opts := options.Find().
		SetSort(bson.D{{Key: "publishedAt", Value: -1}, {Key: "createdAt", Value: -1}}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := database.BlogPostsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var posts []models.BlogPost
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, err
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return &models.BlogPostListResponse{
		Data:       posts,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// CreatePost cria um novo post
func CreatePost(ctx context.Context, authorID, authorName, authorAvatar, authorUsername, authorSpecialty string, req models.CreateBlogPostRequest) (*models.BlogPost, error) {
	authorOID, err := primitive.ObjectIDFromHex(authorID)
	if err != nil {
		return nil, err
	}

	// Gerar slug
	slug := generateSlug(req.Title)

	// Verificar se o slug já existe
	var existingPost models.BlogPost
	err = database.BlogPostsCollection.FindOne(ctx, bson.M{"slug": slug}).Decode(&existingPost)
	if err == nil {
		// Slug já existe, adicionar sufixo único
		slug = slug + "-" + primitive.NewObjectID().Hex()[:6]
	}

	now := time.Now()
	var publishedAt *time.Time
	if req.Published {
		publishedAt = &now
	}

	post := &models.BlogPost{
		ID:       primitive.NewObjectID(),
		AuthorID: authorOID,
		Author: &models.BlogPostAuthor{
			ID:        authorOID,
			Name:      authorName,
			Avatar:    authorAvatar,
			Username:  authorUsername,
			Specialty: authorSpecialty,
		},
		Title:         req.Title,
		Slug:          slug,
		Excerpt:       req.Excerpt,
		Content:       req.Content,
		FeaturedImage: req.FeaturedImage,
		Attachments:   []models.BlogAttachment{},
		Category:      req.Category,
		Tags:          req.Tags,
		Published:     req.Published,
		PublishedAt:   publishedAt,
		Views:         0,
		Likes:         0,
		LikedBy:       []primitive.ObjectID{},
		CommentsCount: 0,
		SEO:           req.SEO,
		Featured:      false,
		ReadTime:      calculateReadTime(req.Content),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	// Preencher SEO padrão se não fornecido
	if post.SEO.MetaTitle == "" {
		post.SEO.MetaTitle = req.Title
	}
	if post.SEO.MetaDescription == "" && len(req.Excerpt) > 0 {
		post.SEO.MetaDescription = req.Excerpt
		if len(post.SEO.MetaDescription) > 160 {
			post.SEO.MetaDescription = post.SEO.MetaDescription[:157] + "..."
		}
	}

	_, err = database.BlogPostsCollection.InsertOne(ctx, post)
	if err != nil {
		return nil, err
	}

	return post, nil
}

func AddAttachments(ctx context.Context, postID, userID string, isAdmin bool, attachments []models.BlogAttachment) (*models.BlogPost, error) {
	oid, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return nil, ErrPostNotFound
	}

	authorOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrUnauthorized
	}

	// Apenas autor (ou admin) pode anexar
	var post models.BlogPost
	err = database.BlogPostsCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}
	if !isAdmin && post.AuthorID != authorOID {
		return nil, ErrUnauthorized
	}

	update := bson.M{
		"$push": bson.M{
			"attachments": bson.M{
				"$each": attachments,
			},
		},
		"$set": bson.M{"updatedAt": time.Now()},
	}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updated models.BlogPost
	if err := database.BlogPostsCollection.FindOneAndUpdate(ctx, bson.M{"_id": oid}, update, opts).Decode(&updated); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}
	return &updated, nil
}

// GetPostBySlug busca um post pelo slug
func GetPostBySlug(ctx context.Context, slug string, incrementViews bool) (*models.BlogPost, error) {
	filter := bson.M{"slug": slug}

	if incrementViews {
		update := bson.M{
			"$inc": bson.M{"views": 1},
		}
		opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
		var post models.BlogPost
		err := database.BlogPostsCollection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&post)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				return nil, ErrPostNotFound
			}
			return nil, err
		}
		return &post, nil
	}

	var post models.BlogPost
	err := database.BlogPostsCollection.FindOne(ctx, filter).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	return &post, nil
}

// GetPostByID busca um post pelo ID
func GetPostByID(ctx context.Context, id string) (*models.BlogPost, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var post models.BlogPost
	err = database.BlogPostsCollection.FindOne(ctx, bson.M{"_id": oid}).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	return &post, nil
}

// UpdatePost atualiza um post
func UpdatePost(ctx context.Context, postID, userID string, req models.UpdateBlogPostRequest) (*models.BlogPost, error) {
	postOID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return nil, err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Verificar se o usuário é o autor
	var post models.BlogPost
	err = database.BlogPostsCollection.FindOne(ctx, bson.M{"_id": postOID}).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	if post.AuthorID != userOID {
		return nil, ErrUnauthorized
	}

	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if req.Title != "" {
		update["$set"].(bson.M)["title"] = req.Title
		// Atualizar slug se título mudou
		newSlug := generateSlug(req.Title)
		if newSlug != post.Slug {
			// Verificar se o novo slug já existe
			var existingPost models.BlogPost
			err = database.BlogPostsCollection.FindOne(ctx, bson.M{"slug": newSlug, "_id": bson.M{"$ne": postOID}}).Decode(&existingPost)
			if err == nil {
				newSlug = newSlug + "-" + primitive.NewObjectID().Hex()[:6]
			}
			update["$set"].(bson.M)["slug"] = newSlug
		}
	}

	if req.Excerpt != "" {
		update["$set"].(bson.M)["excerpt"] = req.Excerpt
	}

	if req.Content != "" {
		update["$set"].(bson.M)["content"] = req.Content
		update["$set"].(bson.M)["readTime"] = calculateReadTime(req.Content)
	}

	if req.FeaturedImage != "" {
		update["$set"].(bson.M)["featuredImage"] = req.FeaturedImage
	}

	if req.Category != "" {
		update["$set"].(bson.M)["category"] = req.Category
	}

	if req.Tags != nil {
		update["$set"].(bson.M)["tags"] = req.Tags
	}

	if req.Published != nil {
		update["$set"].(bson.M)["published"] = *req.Published
		// Se está sendo publicado pela primeira vez
		if *req.Published && post.PublishedAt == nil {
			now := time.Now()
			update["$set"].(bson.M)["publishedAt"] = now
		}
	}

	if req.SEO != nil {
		update["$set"].(bson.M)["seo"] = *req.SEO
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedPost models.BlogPost
	err = database.BlogPostsCollection.FindOneAndUpdate(ctx, bson.M{"_id": postOID}, update, opts).Decode(&updatedPost)
	if err != nil {
		return nil, err
	}

	return &updatedPost, nil
}

// DeletePost deleta um post
func DeletePost(ctx context.Context, postID, userID string, isAdmin bool) error {
	postOID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return err
	}

	// Verificar se o usuário é o autor (se não for admin)
	if !isAdmin {
		userOID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			return err
		}

		var post models.BlogPost
		err = database.BlogPostsCollection.FindOne(ctx, bson.M{"_id": postOID}).Decode(&post)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				return ErrPostNotFound
			}
			return err
		}

		if post.AuthorID != userOID {
			return ErrUnauthorized
		}
	}

	_, err = database.BlogPostsCollection.DeleteOne(ctx, bson.M{"_id": postOID})
	return err
}

// LikePost curte um post
func LikePost(ctx context.Context, postID, userID string) (*models.BlogPost, error) {
	postOID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return nil, err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Verificar se o usuário já curtiu
	var post models.BlogPost
	err = database.BlogPostsCollection.FindOne(ctx, bson.M{"_id": postOID}).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	for _, likedUserID := range post.LikedBy {
		if likedUserID == userOID {
			return nil, ErrAlreadyLiked
		}
	}

	update := bson.M{
		"$inc":  bson.M{"likes": 1},
		"$push": bson.M{"likedBy": userOID},
		"$set":  bson.M{"updatedAt": time.Now()},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedPost models.BlogPost
	err = database.BlogPostsCollection.FindOneAndUpdate(ctx, bson.M{"_id": postOID}, update, opts).Decode(&updatedPost)
	if err != nil {
		return nil, err
	}

	return &updatedPost, nil
}

// UnlikePost remove a curtida de um post
func UnlikePost(ctx context.Context, postID, userID string) (*models.BlogPost, error) {
	postOID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return nil, err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	update := bson.M{
		"$inc":  bson.M{"likes": -1},
		"$pull": bson.M{"likedBy": userOID},
		"$set":  bson.M{"updatedAt": time.Now()},
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedPost models.BlogPost
	err = database.BlogPostsCollection.FindOneAndUpdate(ctx, bson.M{"_id": postOID}, update, opts).Decode(&updatedPost)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	return &updatedPost, nil
}

// GetCategories retorna as categorias disponíveis com contagem de posts
func GetCategories(ctx context.Context) ([]models.BlogCategoryInfo, error) {
	categories := []models.BlogCategoryInfo{
		{Value: models.BlogCategorySustentabilidade, Label: "Sustentabilidade", Description: "Alimentação consciente e sustentabilidade"},
		{Value: models.BlogCategoryTendencias, Label: "Tendências", Description: "Tendências e novidades em nutrição"},
		{Value: models.BlogCategoryDicas, Label: "Dicas", Description: "Dicas práticas para o dia a dia"},
		{Value: models.BlogCategoryProjetos, Label: "Conteúdos", Description: "Materiais e conteúdos do profissional"},
		{Value: models.BlogCategoryMateriais, Label: "Materiais", Description: "Materiais educativos e guias"},
		{Value: models.BlogCategoryInteriores, Label: "Receitas", Description: "Receitas e ideias de preparo"},
		{Value: models.BlogCategoryReforma, Label: "Emagrecimento", Description: "Educação alimentar e estratégias de emagrecimento"},
		{Value: models.BlogCategoryNoticias, Label: "Notícias", Description: "Notícias e atualizações relevantes"},
	}

	// Contar posts por categoria
	for i := range categories {
		count, err := database.BlogPostsCollection.CountDocuments(ctx, bson.M{
			"category":  categories[i].Value,
			"published": true,
		})
		if err == nil {
			categories[i].PostCount = count
		}
	}

	return categories, nil
}

// GetFeaturedPosts retorna os posts em destaque
func GetFeaturedPosts(ctx context.Context, limit int) ([]models.BlogPost, error) {
	if limit < 1 || limit > 50 {
		limit = 5
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "publishedAt", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := database.BlogPostsCollection.Find(ctx, bson.M{
		"featured":  true,
		"published": true,
	}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var posts []models.BlogPost
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, err
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	return posts, nil
}

// GetPopularPosts retorna os posts mais populares
func GetPopularPosts(ctx context.Context, limit int) ([]models.BlogPost, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}

	opts := options.Find().
		SetSort(bson.D{
			{Key: "views", Value: -1},
			{Key: "likes", Value: -1},
		}).
		SetLimit(int64(limit))

	cursor, err := database.BlogPostsCollection.Find(ctx, bson.M{"published": true}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var posts []models.BlogPost
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, err
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	return posts, nil
}

// GetRecentPosts retorna os posts mais recentes
func GetRecentPosts(ctx context.Context, limit int) ([]models.BlogPost, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "publishedAt", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := database.BlogPostsCollection.Find(ctx, bson.M{"published": true}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var posts []models.BlogPost
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, err
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	return posts, nil
}

// GetPostsByAuthor retorna os posts de um autor
func GetPostsByAuthor(ctx context.Context, authorID string, limit int, onlyPublished bool) ([]models.BlogPost, error) {
	authorOID, err := primitive.ObjectIDFromHex(authorID)
	if err != nil {
		return nil, err
	}

	if limit < 1 || limit > 50 {
		limit = 10
	}

	filter := bson.M{"authorId": authorOID}
	if onlyPublished {
		filter["published"] = true
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "publishedAt", Value: -1}, {Key: "createdAt", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := database.BlogPostsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var posts []models.BlogPost
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, err
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	return posts, nil
}

// GetRelatedPosts retorna posts relacionados
func GetRelatedPosts(ctx context.Context, postID string, limit int) ([]models.BlogPost, error) {
	postOID, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return nil, err
	}

	// Buscar o post original
	var post models.BlogPost
	err = database.BlogPostsCollection.FindOne(ctx, bson.M{"_id": postOID}).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	if limit < 1 || limit > 20 {
		limit = 5
	}

	// Buscar posts relacionados (mesma categoria ou tags semelhantes)
	filter := bson.M{
		"_id":       bson.M{"$ne": postOID},
		"published": true,
		"$or": []bson.M{
			{"category": post.Category},
			{"tags": bson.M{"$in": post.Tags}},
		},
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "publishedAt", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := database.BlogPostsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var posts []models.BlogPost
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, err
	}

	if posts == nil {
		posts = []models.BlogPost{}
	}

	return posts, nil
}

// GetBlogStats retorna estatísticas do blog
func GetBlogStats(ctx context.Context, userID string) (*models.BlogStats, error) {
	stats := &models.BlogStats{}

	// Total de posts
	total, err := database.BlogPostsCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	stats.TotalPosts = total

	// Posts publicados
	published, err := database.BlogPostsCollection.CountDocuments(ctx, bson.M{"published": true})
	if err != nil {
		return nil, err
	}
	stats.PublishedPosts = published

	// Rascunhos
	stats.DraftPosts = total - published

	// Estatísticas do usuário específico
	if userID != "" {
		userOID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			myPosts, err := database.BlogPostsCollection.CountDocuments(ctx, bson.M{"authorId": userOID})
			if err == nil {
				stats.MyPosts = myPosts
			}
		}
	}

	return stats, nil
}



