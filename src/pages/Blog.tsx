import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BLOG_POSTS, BLOG_TAGS, AUTHORS, type BlogPost } from '@/data/blogPosts';

function TagBadge({ tag }: { tag: string }) {
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      {tag}
    </Badge>
  );
}

function AuthorRow({ post, size = 'sm' }: { post: BlogPost; size?: 'sm' | 'md' }) {
  const avatarSize = size === 'md' ? 'h-9 w-9' : 'h-7 w-7';
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={post.author.avatar}
        alt={post.author.name}
        className={`${avatarSize} rounded-full object-cover`}
      />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground leading-tight">{post.author.name}</span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{post.author.role}</span>
          <span>·</span>
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>
      </div>
    </div>
  );
}

function FeaturedArticle({ post }: { post: BlogPost }) {
  return (
    <article className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground">
        Featured article
      </h4>
      <Link to={`/blog/${post.slug}`} className="block group">
        <div className="aspect-[2/1] rounded-lg overflow-hidden bg-black">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
      <Link to={`/blog/${post.slug}`} className="block group">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
          {post.title}
        </h2>
      </Link>
      <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>
      <AuthorRow post={post} size="md" />
    </article>
  );
}

function EditorPickCard({ post }: { post: BlogPost }) {
  return (
    <article className="py-5 first:pt-0">
      <div className="flex flex-wrap gap-2 mb-2">
        {post.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
      <Link to={`/blog/${post.slug}`} className="group">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
          {post.title}
        </h3>
      </Link>
      <div className="flex items-center gap-2">
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="h-6 w-6 rounded-full object-cover"
        />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{post.author.name}</span>
          <span>·</span>
          <span>{post.date}</span>
        </div>
      </div>
    </article>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group">
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="aspect-[16/10] rounded-lg overflow-hidden bg-muted mb-4">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 mb-2">
        {post.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>
      <Link to={`/blog/${post.slug}`} className="block">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-3">
          {post.title}
        </h3>
      </Link>
      <AuthorRow post={post} />
    </article>
  );
}

export default function Blog() {
  const [activeTag, setActiveTag] = useState('All');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featuredPost = BLOG_POSTS.find((p) => p.featured)!;
  const editorPicks = BLOG_POSTS.filter((p) => p.editorPick);
  const gridPosts = BLOG_POSTS.filter((p) => !p.featured);

  const filteredGridPosts =
    activeTag === 'All'
      ? gridPosts
      : gridPosts.filter((p) => p.tags.includes(activeTag));

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-[1088px] px-4">
          {/* Hero: Featured + Editor's Picks */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 mb-16">
            <FeaturedArticle post={featuredPost} />

            <aside>
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">
                Editor's picks
              </h4>
              <div className="divide-y divide-border">
                {editorPicks.map((post) => (
                  <EditorPickCard key={post.id} post={post} />
                ))}
              </div>
            </aside>
          </div>

          <Separator className="mb-10" />

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {BLOG_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGridPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {filteredGridPosts.length === 0 && (
            <p className="text-center text-muted-foreground py-16">
              No articles found for "{activeTag}". Check back soon!
            </p>
          )}
        </div>

        {/* Meet Our Experts */}
        <section className="mt-20 pb-16">
          <div className="container mx-auto max-w-[1088px] px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">Our experts on the blog</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Industry professionals sharing insights on audio advertising, podcasts, and digital growth across the MENA region.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Object.values(AUTHORS).map((author) => (
                <div key={author.name} className="flex flex-col items-center text-center">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="h-20 w-20 rounded-full object-cover mb-3 border-2 border-border"
                  />
                  <h3 className="font-semibold text-foreground text-sm leading-tight">{author.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{author.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
