package storage

import (
	"fmt"
	"strings"
)

// Subpastas por tipo de conteúdo dentro da pasta do usuário ({userId}/...).
const (
	SubProfileAvatar = "profile/avatar"
	SubProfileCover  = "profile/cover"
	SubProjects      = "projects"
	SubRecipes       = "recipes"
	SubBlogImages    = "blog/images"
	SubBlogPptx      = "blog/pptx"
	SubFoodDiary     = "food-diary"
	SubLabExams      = "lab-exams"
	SubVerification  = "verification"
	SubModels        = "models"
)

func joinKey(segments ...string) string {
	parts := make([]string, 0, len(segments))
	for _, s := range segments {
		s = strings.Trim(s, "/")
		if s != "" {
			parts = append(parts, s)
		}
	}
	return strings.Join(parts, "/")
}

func userKey(userID, subfolder, filename string) string {
	return joinKey(userID, subfolder, filename)
}

func userScopedKey(userID, subfolder, resourceID, filename string) string {
	return joinKey(userID, subfolder, resourceID, filename)
}

// BuildAvatarKey: {userId}/profile/avatar/{filename}
func BuildAvatarKey(userID, filename string) string {
	return userKey(userID, SubProfileAvatar, filename)
}

// BuildCoverKey: {userId}/profile/cover/{filename}
func BuildCoverKey(userID, filename string) string {
	return userKey(userID, SubProfileCover, filename)
}

// BuildProjectImageKey: {userId}/projects/{projectId}/{filename}
func BuildProjectImageKey(userID, projectID, filename string) string {
	return userScopedKey(userID, SubProjects, projectID, filename)
}

// BuildRecipeImageKey: {userId}/recipes/{recipeId}/{filename}
func BuildRecipeImageKey(userID, recipeID, filename string) string {
	return userScopedKey(userID, SubRecipes, recipeID, filename)
}

// BuildBlogImageKey: {userId}/blog/images/{postId}/{filename}
func BuildBlogImageKey(userID, postID, filename string) string {
	return userScopedKey(userID, SubBlogImages, postID, filename)
}

// BuildBlogPptxKey: {userId}/blog/pptx/{postId}/{filename}
func BuildBlogPptxKey(userID, postID, filename string) string {
	return userScopedKey(userID, SubBlogPptx, postID, filename)
}

// BuildFoodDiaryPhotoKey: {userId}/food-diary/{entryId}/{filename}
func BuildFoodDiaryPhotoKey(userID, entryID, filename string) string {
	return userScopedKey(userID, SubFoodDiary, entryID, filename)
}

// BuildLabExamKey: {userId}/lab-exams/{examId}/{filename}
func BuildLabExamKey(userID, examID, filename string) string {
	return userScopedKey(userID, SubLabExams, examID, filename)
}

// BuildVerificationKey: {userId}/verification/{filename}
func BuildVerificationKey(userID, filename string) string {
	return userKey(userID, SubVerification, filename)
}

// BuildModelKey: {userId}/models/{filename}
func BuildModelKey(userID, filename string) string {
	return userKey(userID, SubModels, filename)
}

// BuildPublicID mantém compatibilidade com chamadas legadas (projetos/blog).
func BuildPublicID(userID, resourceID, filename string) string {
	return BuildProjectImageKey(userID, resourceID, filename)
}

func BuildPublicIDForAvatar(userID, filename string) string {
	return BuildAvatarKey(userID, filename)
}

func BuildPublicIDForCover(userID, filename string) string {
	return BuildCoverKey(userID, filename)
}

// PrefixForUser retorna o prefixo de listagem para um usuário.
func PrefixForUser(userID string) string {
	return fmt.Sprintf("%s/", strings.Trim(userID, "/"))
}

// PrefixForUserSubfolder retorna o prefixo de listagem para uma subpasta do usuário.
func PrefixForUserSubfolder(userID, subfolder string) string {
	return joinKey(userID, subfolder) + "/"
}
