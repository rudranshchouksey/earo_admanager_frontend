import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BLOG_POSTS } from '@/data/blogPosts';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="pt-24 pb-16">
          <div className="container mx-auto max-w-[720px] px-4 text-center py-20">
            <h1 className="text-2xl font-semibold text-foreground mb-4">Article not found</h1>
            <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  // Get related posts (same tags, excluding current)
  const relatedPosts = BLOG_POSTS
    .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-[720px] px-4">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Title */}
          <h1 className="text-3xl md:text-[42px] font-semibold text-foreground leading-tight mb-4">
            {post.title}
          </h1>

          {/* Author byline */}
          <div className="flex items-center gap-3 mb-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{post.author.name}</span>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{post.author.role}</span>
                <span>·</span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-medium">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Hero Image */}
          <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted mb-10">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Body */}
          <div className="mb-16">
            {post.body ? (
              <article
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-li:text-muted-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: post.body }}
              />
            ) : (
              <DefaultArticleBody excerpt={post.excerpt} />
            )}
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <>
              <Separator className="mb-10" />
              <h2 className="text-xl font-semibold text-foreground mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rp) => (
                  <Link key={rp.id} to={`/blog/${rp.slug}`} className="group">
                    <div className="aspect-[16/10] rounded-lg overflow-hidden bg-muted mb-3">
                      <img
                        src={rp.coverImage}
                        alt={rp.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                      {rp.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{rp.date}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">{children}</h2>
  );
}

function BenefitPill({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
      <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
      <p className="text-muted-foreground text-[15px] leading-relaxed">
        <span className="font-semibold text-foreground">{label}</span> — {description}
      </p>
    </div>
  );
}

function DefaultArticleBody({ excerpt }: { excerpt: string }) {
  return (
    <div className="space-y-5">
      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{excerpt}</p>

      <SectionHeading>Why Audio Advertising?</SectionHeading>
      <p className="text-muted-foreground leading-relaxed">
        Audio is one of the fastest-growing advertising channels in the MENA region. With over 80% of
        the UAE population streaming music or podcasts daily, brands have an unprecedented opportunity
        to reach engaged audiences in a distraction-free environment.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Unlike visual ads that compete with endless scrolling, audio ads command 100% share of ear —
        listeners can't skip or scroll past them. This translates to significantly higher brand recall
        and purchase intent compared to traditional digital channels.
      </p>

      <SectionHeading>The EARO Advantage</SectionHeading>
      <p className="text-muted-foreground leading-relaxed">
        EARO makes it simple for businesses of any size to create and launch professional audio ad
        campaigns. Our AI-powered platform handles everything from script writing to voice generation,
        delivering broadcast-quality ads in minutes instead of weeks.
      </p>

      <blockquote className="border-l-4 border-primary bg-muted/40 rounded-r-lg p-5 my-8">
        <p className="text-foreground italic text-lg leading-relaxed">
          "We launched our first audio campaign in under 10 minutes. The results exceeded every
          benchmark we had from social media advertising."
        </p>
      </blockquote>

      <SectionHeading>Key Benefits</SectionHeading>
      <div className="grid gap-3">
        <BenefitPill label="100% Share of Ear" description="No competing ads or distractions during playback" />
        <BenefitPill label="2.4× Higher Recall" description="Audio ads are remembered better than display ads" />
        <BenefitPill label="Precise Targeting" description="Reach listeners by location, demographics, and interests" />
        <BenefitPill label="Affordable Entry" description="Start campaigns from just AED 50/day" />
        <BenefitPill label="AI-Powered Creation" description="Professional ads without a recording studio" />
      </div>

      <SectionHeading>Getting Started</SectionHeading>
      <p className="text-muted-foreground leading-relaxed">
        Ready to reach millions of listeners across Dubai, Abu Dhabi, and the wider MENA region?
        EARO's self-serve platform lets you go from idea to live campaign in minutes. Simply enter
        your brand URL, customize your message, and launch.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Whether you're a local restaurant, a growing e-commerce brand, or an established enterprise,
        audio advertising offers an untapped channel to connect with your customers in a meaningful,
        memorable way.
      </p>
    </div>
  );
}
