import os
import re
import json
import hashlib
import time

import feedparser
import anthropic
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

GRAPHCMS_ENDPOINT = os.getenv("NEXT_PUBLIC_GRAPHCMS_ENDPOINT")
HYGRAPH_WRITE_TOKEN = os.getenv("HYGRAPH_WRITE_TOKEN")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

AUTHOR_ID = "cmppeedszsn6207myqv1mni6i"       # SamoDev AI author node
DEFAULT_IMAGE_ID = "cmgpavuhj7r2807n8a5hpt1dh"  # default blog cover asset

RSS_FEEDS = [
    "https://www.anthropic.com/rss.xml",
    "https://openai.com/blog/rss.xml",
    "https://huggingface.co/blog/feed.xml",
    "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
]

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def generate_slug(title: str) -> str:
    slug = title.lower()
    slug = slug.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    hash_suffix = hashlib.md5(title.encode()).hexdigest()[:6]
    return f"{slug}-{hash_suffix}"


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text).strip()


def fetch_article_text(url: str) -> str:
    try:
        response = requests.get(url, headers=BROWSER_HEADERS, timeout=15)
        response.raise_for_status()
        html = response.text
        # Remove noisy blocks before stripping tags
        html = re.sub(
            r"<(script|style|nav|footer|header|aside|noscript)[^>]*>.*?</(script|style|nav|footer|header|aside|noscript)>",
            " ", html, flags=re.DOTALL | re.IGNORECASE,
        )
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:3000]
    except Exception as e:
        print(f"  Article fetch error: {e}")
        return ""


def html_to_richtext_ast(html: str) -> dict:
    """Convert simple <p>/<h2>/<ul><li> HTML to Hygraph RichTextAST."""
    nodes = []
    pattern = re.compile(r"<(h2|p|ul)>(.*?)</(h2|p|ul)>", re.DOTALL | re.IGNORECASE)
    for match in pattern.finditer(html):
        tag = match.group(1).lower()
        inner = match.group(2)
        if tag == "h2":
            text = re.sub(r"<[^>]+>", "", inner).strip()
            if text:
                nodes.append({"type": "heading-two", "children": [{"text": text}]})
        elif tag == "p":
            text = re.sub(r"<[^>]+>", "", inner).strip()
            if text:
                nodes.append({"type": "paragraph", "children": [{"text": text}]})
        elif tag == "ul":
            items = re.findall(r"<li>(.*?)</li>", inner, re.DOTALL | re.IGNORECASE)
            list_children = []
            for item in items:
                text = re.sub(r"<[^>]+>", "", item).strip()
                if text:
                    list_children.append({
                        "type": "list-item",
                        "children": [{"type": "list-item-child", "children": [{"text": text}]}],
                    })
            if list_children:
                nodes.append({"type": "bulleted-list", "children": list_children})

    if not nodes:
        fallback = re.sub(r"<[^>]+>", "", html).strip()
        if fallback:
            nodes.append({"type": "paragraph", "children": [{"text": fallback}]})

    return {"children": nodes}


def analyze_article(title: str, full_text: str) -> dict:
    prompt = f"""You are an AI news analyst writing for an Uzbek tech blog. Analyze the article below and return ONLY a valid JSON object — no markdown, no explanation.

Title: {title}
Article text: {full_text}

Return exactly this structure:
{{
  "titleUz": "<title translated to Uzbek>",
  "descriptionUz": "<2-3 sentence summary in Uzbek>",
  "importanceLevel": "<LOW | MEDIUM | HIGH>",
  "canLearn": <true | false>,
  "canTest": <true | false>,
  "actionSuggestion": "<1-2 sentence actionable suggestion in Uzbek>",
  "aiTool": "<Claude | GPT | Gemini | Other>",
  "contentHtml": "<full Uzbek article, 400-600 words, using only <p>, <h2>, <ul><li> tags>"
}}

Rules:
- importanceLevel HIGH = breakthrough or major release; MEDIUM = noteworthy update; LOW = minor news
- canLearn = true if article teaches concepts or techniques
- canTest = true if a tool, model, or feature is available to try
- aiTool: Claude = Anthropic content, GPT = OpenAI/ChatGPT content, Gemini = Google content, Other = anything else
- contentHtml: write a full informative article in Uzbek based on the source text. Use <h2> for section headings, <p> for paragraphs, <ul><li> for lists. 400-600 words. No inline styles, classes, or other HTML tags.
"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


def check_exists(source_url: str) -> bool:
    print(f"  Checking: {source_url}")
    query = """
    {
      blogs(where: { sourceUrl: "%s" }, stage: DRAFT) {
        id
      }
    }
    """ % source_url
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": query},
        headers={
            "Authorization": f"Bearer {HYGRAPH_WRITE_TOKEN}",
            "Content-Type": "application/json",
            "hyg-include-system-models": "true",
        },
    )
    response.raise_for_status()
    data = response.json()
    blogs = data.get("data", {}).get("blogs", [])
    return len(blogs) > 0


def publish_blog(blog_id: str) -> dict:
    mutation = """
    mutation {
      publishBlog(where: { id: "%s" }, to: PUBLISHED) {
        id
      }
    }
    """ % blog_id
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": mutation},
        headers={
            "Authorization": f"Bearer {HYGRAPH_WRITE_TOKEN}",
            "Content-Type": "application/json",
        },
    )
    response.raise_for_status()
    return response.json()


def send_to_hygraph(article: dict) -> dict:
    mutation = """
    mutation CreateBlog(
      $title: String!
      $description: String!
      $sourceUrl: String!
      $aiTool: String
      $actionSuggestion: String
      $importanceLevel: ImportanceLevel!
      $postStatus: PostStatus = new
      $canLearn: Boolean!
      $canTest: Boolean!
      $archive: Boolean
      $slug: String!
      $content: RichTextAST
    ) {
      createBlog(data: {
        title: $title
        description: $description
        sourceUrl: $sourceUrl
        aiTool: $aiTool
        actionSuggestion: $actionSuggestion
        importanceLevel: $importanceLevel
        postStatus: $postStatus
        canLearn: $canLearn
        canTest: $canTest
        archive: $archive
        slug: $slug
        content: $content
        author: { connect: { id: "%s" } }
        image: { connect: { id: "%s" } }
      }) {
        id
        title
        slug
      }
    }
    """ % (AUTHOR_ID, DEFAULT_IMAGE_ID)
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": mutation, "variables": article},
        headers={
            "Authorization": f"Bearer {HYGRAPH_WRITE_TOKEN}",
            "Content-Type": "application/json",
        },
    )
    print(f"  Response status: {response.status_code}")
    if not response.ok:
        print(f"  Response text: {response.text}")
    response.raise_for_status()
    return response.json()


def process_feed(feed_url: str):
    print(f"\nFetching: {feed_url}")
    feed = feedparser.parse(feed_url)

    if feed.bozo:
        print(f"  Warning: {feed.bozo_exception}")

    entries = feed.entries[:5]
    print(f"  {len(entries)} entries found")

    for entry in entries:
        title = entry.get("title", "").strip()
        source_url = entry.get("link", "").strip()

        if not title or not source_url:
            print("  Skipping: missing title or URL")
            continue

        time.sleep(1)
        if check_exists(source_url):
            print(f"  Skipping (already exists): {title}")
            continue

        print(f"  Fetching article: {title[:70]}...")
        time.sleep(1)
        full_text = fetch_article_text(source_url)
        if not full_text:
            # Fall back to RSS description if fetch fails
            full_text = strip_html(entry.get("summary", entry.get("description", ""))).strip()
        if len(full_text) > 3000:
            full_text = full_text[:3000] + "..."

        print(f"  Analyzing: {title[:70]}...")

        try:
            analysis = analyze_article(title, full_text)
        except Exception as e:
            print(f"  Claude error: {e}")
            continue

        slug = generate_slug(analysis.get("titleUz", title))

        content_html = analysis.get("contentHtml", "")
        content_ast = html_to_richtext_ast(content_html) if content_html else None

        article = {
            "title": analysis.get("titleUz", title),
            "description": analysis.get("descriptionUz", full_text[:200]),
            "sourceUrl": source_url,
            "aiTool": analysis.get("aiTool", "Other"),
            "actionSuggestion": analysis.get("actionSuggestion", ""),
            "importanceLevel": analysis.get("importanceLevel", "LOW"),
            "postStatus": "NEW",
            "canLearn": analysis.get("canLearn", False),
            "canTest": analysis.get("canTest", False),
            "archive": False,
            "slug": slug,
            "content": content_ast,
        }
        article["importanceLevel"] = article["importanceLevel"].lower()
        article["postStatus"] = article["postStatus"].lower()

        try:
            time.sleep(1)
            result = send_to_hygraph(article)
            if "errors" in result:
                print(f"  Hygraph error: {result['errors']}")
            else:
                created = result.get("data", {}).get("createBlog", {})
                print(f"  Created: id={created.get('id')}  slug={created.get('slug')}")
                blog_id = created.get("id")
                if blog_id:
                    time.sleep(1)
                    publish_blog(blog_id)
                    print(f"  Published: id={blog_id}")
        except Exception as e:
            print(f"  Hygraph request error: {e}")


def main():
    print("RSS Agent starting...")
    if not all([GRAPHCMS_ENDPOINT, HYGRAPH_WRITE_TOKEN, ANTHROPIC_API_KEY]):
        raise EnvironmentError("Missing one or more required environment variables.")

    for feed_url in RSS_FEEDS:
        process_feed(feed_url)

    print("\nDone.")


if __name__ == "__main__":
    main()
