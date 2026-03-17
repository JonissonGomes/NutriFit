package database

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Users indexes
	usersIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "email", Value: 1}}, Options: indexOptions().SetUnique(true)},
		{Keys: bson.D{{Key: "oauth.google.id", Value: 1}}, Options: indexOptions().SetSparse(true)},
		{Keys: bson.D{{Key: "role", Value: 1}}},
		{Keys: bson.D{{Key: "location.coordinates", Value: "2dsphere"}}},
		{Keys: bson.D{{Key: "location.address.city", Value: 1}, {Key: "location.address.state", Value: 1}}},
		{Keys: bson.D{{Key: "adminMetadata.status", Value: 1}}},
		{Keys: bson.D{{Key: "professionalRegistration.type", Value: 1}, {Key: "professionalRegistration.number", Value: 1}}, Options: indexOptions().SetUnique(true).SetSparse(true)},
	}
	_, err := UsersCollection.Indexes().CreateMany(ctx, usersIndexes)
	if err != nil {
		return err
	}

	// Projects indexes
	projectsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "status", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "category", Value: 1}}},
		{Keys: bson.D{{Key: "clientId", Value: 1}}},
	}
	_, err = ProjectsCollection.Indexes().CreateMany(ctx, projectsIndexes)
	if err != nil {
		return err
	}

	// Images indexes
	imagesIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "projectId", Value: 1}, {Key: "position", Value: 1}}},
		{Keys: bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "cloudinaryId", Value: 1}}, Options: indexOptions().SetUnique(true)},
	}
	_, err = ImagesCollection.Indexes().CreateMany(ctx, imagesIndexes)
	if err != nil {
		return err
	}

	// Refresh tokens indexes
	refreshTokensIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "token", Value: 1}}, Options: indexOptions().SetUnique(true)},
		{Keys: bson.D{{Key: "userId", Value: 1}}},
		{Keys: bson.D{{Key: "expiresAt", Value: 1}}, Options: indexOptions().SetExpireAfterSeconds(0)},
	}
	_, err = RefreshTokensCollection.Indexes().CreateMany(ctx, refreshTokensIndexes)
	if err != nil {
		return err
	}

	// Conversations indexes
	conversationsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "participants", Value: 1}}},
		{Keys: bson.D{{Key: "lastMessageAt", Value: -1}}},
	}
	_, err = ConversationsCollection.Indexes().CreateMany(ctx, conversationsIndexes)
	if err != nil {
		return err
	}

	// Messages indexes
	messagesIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "conversationId", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "senderId", Value: 1}, {Key: "receiverId", Value: 1}}},
		{Keys: bson.D{{Key: "read", Value: 1}, {Key: "receiverId", Value: 1}}},
	}
	_, err = MessagesCollection.Indexes().CreateMany(ctx, messagesIndexes)
	if err != nil {
		return err
	}

	// Services indexes
	servicesIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}, {Key: "active", Value: 1}}},
		{Keys: bson.D{{Key: "category", Value: 1}}},
	}
	_, err = ServicesCollection.Indexes().CreateMany(ctx, servicesIndexes)
	if err != nil {
		return err
	}

	// Events indexes
	eventsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}, {Key: "date", Value: 1}}},
		{Keys: bson.D{{Key: "clientId", Value: 1}, {Key: "date", Value: 1}}},
		{Keys: bson.D{{Key: "date", Value: 1}, {Key: "status", Value: 1}}},
	}
	_, err = EventsCollection.Indexes().CreateMany(ctx, eventsIndexes)
	if err != nil {
		return err
	}

	// Public profiles indexes
	publicProfilesIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "username", Value: 1}}, Options: indexOptions().SetUnique(true)},
		{Keys: bson.D{{Key: "userId", Value: 1}}, Options: indexOptions().SetUnique(true)},
		{Keys: bson.D{{Key: "location.coordinates", Value: "2dsphere"}}},
		{Keys: bson.D{{Key: "location.address.city", Value: 1}, {Key: "location.address.state", Value: 1}}},
		{Keys: bson.D{{Key: "boost.active", Value: 1}, {Key: "boost.endDate", Value: 1}}},
		{Keys: bson.D{{Key: "boost.priority", Value: -1}, {Key: "boost.active", Value: 1}}},
	}
	_, err = PublicProfilesCollection.Indexes().CreateMany(ctx, publicProfilesIndexes)
	if err != nil {
		return err
	}

	// Favorites indexes
	favoritesIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "clientId", Value: 1}, {Key: "architectId", Value: 1}}, Options: indexOptions().SetUnique(true)},
		{Keys: bson.D{{Key: "clientId", Value: 1}}},
	}
	_, err = FavoritesCollection.Indexes().CreateMany(ctx, favoritesIndexes)
	if err != nil {
		return err
	}

	// User settings indexes
	userSettingsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}}, Options: indexOptions().SetUnique(true)},
	}
	_, err = UserSettingsCollection.Indexes().CreateMany(ctx, userSettingsIndexes)
	if err != nil {
		return err
	}

	// Billing indexes
	billingIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}}, Options: indexOptions().SetUnique(true)},
		{Keys: bson.D{{Key: "status", Value: 1}}},
	}
	_, err = BillingCollection.Indexes().CreateMany(ctx, billingIndexes)
	if err != nil {
		return err
	}

	// Reviews indexes
	reviewsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "architectId", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "clientId", Value: 1}}},
		{Keys: bson.D{{Key: "rating", Value: 1}}},
	}
	_, err = ReviewsCollection.Indexes().CreateMany(ctx, reviewsIndexes)
	if err != nil {
		return err
	}

	// Questions indexes
	questionsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "architectId", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "category", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "title", Value: "text"}, {Key: "content", Value: "text"}}},
	}
	_, err = QuestionsCollection.Indexes().CreateMany(ctx, questionsIndexes)
	if err != nil {
		return err
	}

	// Blog posts indexes
	blogPostsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "authorId", Value: 1}, {Key: "published", Value: 1}}},
		{Keys: bson.D{{Key: "slug", Value: 1}}, Options: indexOptions().SetUnique(true)},
		{Keys: bson.D{{Key: "category", Value: 1}, {Key: "publishedAt", Value: -1}}},
		{Keys: bson.D{{Key: "title", Value: "text"}, {Key: "content", Value: "text"}}},
	}
	_, err = BlogPostsCollection.Indexes().CreateMany(ctx, blogPostsIndexes)
	if err != nil {
		return err
	}

	// Analytics indexes
	analyticsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "architectId", Value: 1}, {Key: "date", Value: -1}}},
		{Keys: bson.D{{Key: "date", Value: 1}}},
	}
	_, err = AnalyticsCollection.Indexes().CreateMany(ctx, analyticsIndexes)
	if err != nil {
		return err
	}

	// Notifications indexes
	notificationsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}, {Key: "sent", Value: 1}, {Key: "scheduledFor", Value: 1}}},
		{Keys: bson.D{{Key: "scheduledFor", Value: 1}}, Options: indexOptions().SetExpireAfterSeconds(0)},
	}
	_, err = NotificationsCollection.Indexes().CreateMany(ctx, notificationsIndexes)
	if err != nil {
		return err
	}

	// Search index indexes
	searchIndexIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "keywords", Value: "text"}}},
		{Keys: bson.D{{Key: "location.coordinates", Value: "2dsphere"}}},
	}
	_, err = SearchIndexCollection.Indexes().CreateMany(ctx, searchIndexIndexes)
	if err != nil {
		return err
	}

	// Model files indexes
	modelFilesIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "projectId", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "userId", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "type", Value: 1}, {Key: "format", Value: 1}}},
		{Keys: bson.D{{Key: "status", Value: 1}, {Key: "conversion.status", Value: 1}}},
		{Keys: bson.D{{Key: "tags", Value: 1}}},
		{Keys: bson.D{{Key: "storagePath", Value: 1}}, Options: indexOptions().SetUnique(true)},
	}
	_, err = ModelFilesCollection.Indexes().CreateMany(ctx, modelFilesIndexes)
	if err != nil {
		return err
	}

	// Admin actions indexes
	adminActionsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "adminId", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "targetType", Value: 1}, {Key: "targetId", Value: 1}}},
		{Keys: bson.D{{Key: "action", Value: 1}, {Key: "createdAt", Value: -1}}},
	}
	_, err = AdminActionsCollection.Indexes().CreateMany(ctx, adminActionsIndexes)
	if err != nil {
		return err
	}

	// Moderation reports indexes
	moderationReportsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "status", Value: 1}, {Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "targetType", Value: 1}, {Key: "targetId", Value: 1}}},
		{Keys: bson.D{{Key: "reporterId", Value: 1}}},
		{Keys: bson.D{{Key: "resolvedBy", Value: 1}}},
	}
	_, err = ModerationReportsCollection.Indexes().CreateMany(ctx, moderationReportsIndexes)
	if err != nil {
		return err
	}

	// Platform settings indexes
	platformSettingsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "key", Value: 1}}, Options: indexOptions().SetUnique(true)},
	}
	_, err = PlatformSettingsCollection.Indexes().CreateMany(ctx, platformSettingsIndexes)
	if err != nil {
		return err
	}

	// Featured content indexes
	featuredContentIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "type", Value: 1}, {Key: "priority", Value: -1}}},
		{Keys: bson.D{{Key: "startDate", Value: 1}, {Key: "endDate", Value: 1}}},
		{Keys: bson.D{{Key: "targetId", Value: 1}, {Key: "type", Value: 1}}},
	}
	_, err = FeaturedContentCollection.Indexes().CreateMany(ctx, featuredContentIndexes)
	if err != nil {
		return err
	}

	// Boost subscriptions indexes
	boostSubscriptionsIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "architectId", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "endDate", Value: 1}}, Options: indexOptions().SetExpireAfterSeconds(0)},
		{Keys: bson.D{{Key: "status", Value: 1}, {Key: "endDate", Value: 1}}},
	}
	_, err = BoostSubscriptionsCollection.Indexes().CreateMany(ctx, boostSubscriptionsIndexes)
	if err != nil {
		return err
	}

	return nil
}

func indexOptions() *options.IndexOptions {
	return options.Index()
}

