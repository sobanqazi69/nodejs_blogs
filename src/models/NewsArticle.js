/**
 * News Article Model - Represents a news article with metadata
 */
export class NewsArticle {
    constructor(data = {}) {
        this.title = data.title || '';
        this.content = data.content || '';
        this.image = data.image || '';
        this.url = data.url || '';
        this.publishedDate = data.publishedDate || null;
        this.duration = data.duration || '';
        this.source = data.source || 'Unknown';
        this.category = data.category || 'general';
    }

    // Check if article has valid title
    isValid() {
        return this.title && this.title.trim().length > 0;
    }

    // Convert to JSON object
    toJSON() {
        return {
            title: this.title,
            content: this.content,
            image: this.image,
            url: this.url,
            publishedDate: this.publishedDate,
            duration: this.duration,
            source: this.source,
            category: this.category
        };
    }

    // Create from JSON data
    static fromJSON(jsonData) {
        return new NewsArticle(jsonData);
    }
}
