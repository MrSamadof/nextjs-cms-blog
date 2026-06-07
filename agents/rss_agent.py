import os
import re
import json
import hashlib
import time
import random

import anthropic
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

GRAPHCMS_ENDPOINT = os.getenv("NEXT_PUBLIC_GRAPHCMS_ENDPOINT")
HYGRAPH_WRITE_TOKEN = os.getenv("HYGRAPH_WRITE_TOKEN")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

AUTHOR_ID = "cmppeedszsn6207myqv1mni6i"       # SamoDev AI author node
DEFAULT_IMAGE_ID = "cmgpavuhj7r2807n8a5hpt1dh"  # default blog cover asset

# --- Tavily Search Configuration ---
# Har bir ishga tushganda 3 ta random query tanlaydi
SEARCH_QUERIES = [
    "latest AI breakthroughs and research 2026",
    "new AI tools and frameworks for developers",
    "LLM tutorials and learning resources",
    "AI agents and automation workflows",
    "open source AI models released this week",
    "prompt engineering best practices and tips",
    "RAG retrieval augmented generation tutorials",
    "AI coding assistants and developer tools",
    "machine learning engineering best practices",
    "artificial intelligence practical applications",
    "fine-tuning LLM models guide",
    "AI workflow automation tools new release",
]

# Har safar nechta query ishlatish
QUERIES_PER_RUN = 3

# Har bir query dan nechta natija olish
RESULTS_PER_QUERY = 5

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


# ============================================================
# Tavily Search
# ============================================================

def search_tavily(query: str, max_results: int = 5) -> list:
    """Tavily API orqali veb qidiruv. Natijalar ro'yxati qaytadi."""
    print(f"  Tavily search: {query}")
    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "advanced",
                "max_results": max_results,
                "include_answer": False,
                "include_raw_content": False,
                "days": 3,  # Oxirgi 3 kun ichidagi natijalar
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])
        print(f"    {len(results)} ta natija topildi")
        return results
    except Exception as e:
        print(f"    Tavily xatosi: {e}")
        return []


def collect_search_results() -> list:
    """Barcha querylar bo'yicha qidiruv natijalarini yig'adi va duplikatlarni olib tashlaydi."""
    selected_queries = random.sample(SEARCH_QUERIES, min(QUERIES_PER_RUN, len(SEARCH_QUERIES)))
    print(f"\nTanlangan querylar: {selected_queries}")

    all_results = []
    seen_urls = set()

    for query in selected_queries:
        results = search_tavily(query, max_results=RESULTS_PER_QUERY)
        for r in results:
            url = r.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append({
                    "title": r.get("title", ""),
                    "url": url,
                    "content": r.get("content", ""),  # Tavily snippet
                    "score": r.get("score", 0),
                })
        time.sleep(1)  # Rate limiting

    print(f"\nJami {len(all_results)} ta unikal natija yig'ildi")
    return all_results


# ============================================================
# Hygraph Helpers (o'zgarishsiz saqlanadi)
# ============================================================

def fetch_categories() -> list:
    query = "{ categories { id name slug } }"
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": query},
        headers={
            "Authorization": f"Bearer {HYGRAPH_WRITE_TOKEN}",
            "Content-Type": "application/json",
        },
    )
    response.raise_for_status()
    return response.json().get("data", {}).get("categories", [])


def fetch_tags() -> list:
    query = "{ tags { id name slug } }"
    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": query},
        headers={
            "Authorization": f"Bearer {HYGRAPH_WRITE_TOKEN}",
            "Content-Type": "application/json",
        },
    )
    response.raise_for_status()
    return response.json().get("data", {}).get("tags", [])


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
    """Maqola sahifasidan matnni oladi (scraping)."""
    try:
        response = requests.get(url, headers=BROWSER_HEADERS, timeout=15)
        response.raise_for_status()
        html = response.text
        # Keraksiz bloklar uchun tozalash
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


# ============================================================
# Claude Analysis
# ============================================================

def analyze_article(title: str, full_text: str, categories: list, tags: list) -> dict:
    category_names = [c["name"] for c in categories]
    tag_names = [t["name"] for t in tags]

    category_hint = (
        f"\nAvailable categories: {json.dumps(category_names)}\n"
        "Pick the single best matching category name exactly as written, or null if none fit well."
        if category_names else ""
    )
    tag_hint = (
        f"\nAvailable tags: {json.dumps(tag_names)}\n"
        "Pick up to 3 matching tag names exactly as written. Return as a JSON array, e.g. [\"AI\", \"OpenAI\"]. Empty array [] if none fit."
        if tag_names else ""
    )

    # Call 1: metadata — small, clean JSON with no embedded HTML
    meta_prompt = f"""You are an AI news analyst. Analyze the article below and return ONLY a valid JSON object — no markdown, no explanation, no extra text.

Title: {title}
Article text: {full_text}
{category_hint}
{tag_hint}

Return exactly this structure:
{{
  "titleUz": "<title translated to Uzbek>",
  "descriptionUz": "<2-3 sentence summary in Uzbek>",
  "importanceLevel": "<LOW | MEDIUM | HIGH>",
  "canLearn": <true | false>,
  "canTest": <true | false>,
  "actionSuggestion": "<1-2 sentence actionable suggestion in Uzbek>",
  "aiTool": "<Claude | GPT | Gemini | Other>",
  "categoryName": "<exact category name from the list above, or null>",
  "tagNames": ["<exact tag name>", ...],
  "relevanceScore": <1-10>,
  "isRelevant": <true | false>
}}

Rules:
- importanceLevel HIGH = breakthrough or major release; MEDIUM = noteworthy update; LOW = minor news
- canLearn = true if article teaches concepts or techniques
- canTest = true if a tool, model, or feature is available to try
- aiTool: Claude = Anthropic content, GPT = OpenAI/ChatGPT content, Gemini = Google content, Other = anything else
- categoryName: only use a name from the provided list; null if no category fits
- tagNames: only use names from the provided list; empty array [] if none fit; max 3
- relevanceScore: 1-10 based on how relevant the article is to these specific domains:
    RELEVANT (score 6-10): AI engineering, AI agents, automation, workflow automation,
    systematization, coding tools, developer tools, programming frameworks, AI model
    releases with technical depth, AI learning resources, prompt engineering, AI pipelines,
    LLMs, RAG, fine-tuning, MLOps, AI APIs, open-source AI tools.
    NOT RELEVANT (score 1-5): business deals, company valuations, investments, mergers,
    AI regulation/policy/law, social controversies, entertainment AI (art/music/movies),
    general consumer features, marketing announcements without technical substance.
- isRelevant: true if relevanceScore >= 6, false otherwise
"""

    meta_msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": meta_prompt}],
    )
    raw = meta_msg.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    result = json.loads(raw)

    # Call 2: full article HTML — returned as raw HTML, not embedded in JSON
    content_prompt = f"""You are a tech journalist writing for an Uzbek-language blog. Based on the article below, write a full informative article in Uzbek (400-600 words).

Title: {title}
Article text: {full_text}

Output ONLY the HTML article body. Use only these tags: <h2>, <p>, <ul>, <li>.
No DOCTYPE, no <html>/<body> wrapper, no inline styles, no classes, no markdown.
Start directly with the first tag.
"""

    content_msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": content_prompt}],
    )
    result["contentHtml"] = content_msg.content[0].text.strip()
    return result


# ============================================================
# Hygraph Operations
# ============================================================

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
    category_slug = article.get("categorySlug")
    tag_slugs = article.get("tagSlugs") or []

    cat_var_decl = "\n      $categorySlug: String" if category_slug else ""
    cat_field = "\n        category: { connect: { slug: $categorySlug } }" if category_slug else ""

    # tag is a single-relation field in Hygraph — use first matched slug only
    tag_slug = tag_slugs[0] if tag_slugs else None
    tag_field = f'\n        tag: {{ connect: {{ slug: "{tag_slug}" }} }}' if tag_slug else ""

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
      $slug: String!%s
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
        content: $content%s%s
        author: { connect: { id: "%s" } }
        image: { connect: { id: "%s" } }
      }) {
        id
        title
        slug
      }
    }
    """ % (cat_var_decl, cat_field, tag_field, AUTHOR_ID, DEFAULT_IMAGE_ID)

    variables = {
        "title": article["title"],
        "description": article["description"],
        "sourceUrl": article["sourceUrl"],
        "aiTool": article["aiTool"],
        "actionSuggestion": article["actionSuggestion"],
        "importanceLevel": article["importanceLevel"],
        "postStatus": article["postStatus"],
        "canLearn": article["canLearn"],
        "canTest": article["canTest"],
        "archive": article["archive"],
        "slug": article["slug"],
        "content": article["content"],
    }
    if category_slug:
        variables["categorySlug"] = category_slug

    response = requests.post(
        GRAPHCMS_ENDPOINT,
        json={"query": mutation, "variables": variables},
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


# ============================================================
# Main: Search → Filter → Publish
# ============================================================

def process_search_results(search_results: list, categories: list, tags: list):
    """Qidiruv natijalarini Claude bilan tahlil qiladi va Hygraph'ga yuklaydi."""
    published_count = 0
    max_posts_per_run = 3  # Har bir ishga tushishda maksimal postlar soni

    for idx, result in enumerate(search_results, 1):
        if published_count >= max_posts_per_run:
            print(f"\n  Maksimal post soni ({max_posts_per_run}) ga yetdi. To'xtatildi.")
            break

        title = result["title"]
        source_url = result["url"]
        snippet = result["content"]

        print(f"\n--- [{idx}/{len(search_results)}] {title[:70]}... ---")

        # Avval Hygraph'da mavjudligini tekshirish
        time.sleep(1)
        if check_exists(source_url):
            print(f"  Skipping (already exists): {title[:70]}")
            continue

        # Maqola to'liq matnini olish (scraping)
        print(f"  Fetching full article text...")
        time.sleep(1)
        full_text = fetch_article_text(source_url)
        if not full_text:
            # Tavily snippet-dan foydalanish
            full_text = snippet
        if len(full_text) > 3000:
            full_text = full_text[:3000] + "..."

        if not full_text.strip():
            print(f"  Skipping (no text): {title[:70]}")
            continue

        # Claude tahlili
        print(f"  Analyzing with Claude...")
        try:
            analysis = analyze_article(title, full_text, categories, tags)
        except Exception as e:
            print(f"  Claude error: {e}")
            continue

        relevance_score = analysis.get("relevanceScore", 5)
        is_relevant = analysis.get("isRelevant", True)
        if not is_relevant:
            print(f"  Skipping (not relevant, score={relevance_score}): {title[:70]}")
            continue

        print(f"  Relevance score: {relevance_score}/10 — proceeding")
        slug = generate_slug(analysis.get("titleUz", title))

        content_html = analysis.get("contentHtml", "")
        content_ast = html_to_richtext_ast(content_html) if content_html else None

        # Resolve category slug from Claude's returned name
        category_name = analysis.get("categoryName")
        category_slug = None
        if category_name:
            match = next(
                (c for c in categories if c["name"].lower() == category_name.lower()),
                None,
            )
            if match:
                category_slug = match["slug"]
                print(f"  Category matched: {match['name']} -> {category_slug}")
            else:
                print(f"  Category not matched: {category_name!r} (no exact match in list)")

        # Resolve tag slugs from Claude's returned names
        tag_slugs = []
        for tag_name in (analysis.get("tagNames") or [])[:3]:
            match = next(
                (t for t in tags if t["name"].lower() == tag_name.lower()),
                None,
            )
            if match:
                tag_slugs.append(match["slug"])
                print(f"  Tag matched: {match['name']} -> {match['slug']}")
            else:
                print(f"  Tag not matched: {tag_name!r} (no exact match in list)")

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
            "categorySlug": category_slug,
            "tagSlugs": tag_slugs,
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
                    published_count += 1
        except Exception as e:
            print(f"  Hygraph request error: {e}")

    print(f"\n  Jami {published_count} ta post chop etildi.")


def main():
    print("=" * 60)
    print("Deep Search Agent starting...")
    print("=" * 60)

    if not all([GRAPHCMS_ENDPOINT, HYGRAPH_WRITE_TOKEN, ANTHROPIC_API_KEY, TAVILY_API_KEY]):
        raise EnvironmentError(
            "Missing one or more required environment variables: "
            "NEXT_PUBLIC_GRAPHCMS_ENDPOINT, HYGRAPH_WRITE_TOKEN, ANTHROPIC_API_KEY, TAVILY_API_KEY"
        )

    # 1. Hygraph'dan kategoriyalar va taglarni olish
    categories = fetch_categories()
    print(f"Loaded {len(categories)} categories: {[c['name'] for c in categories]}")

    tags = fetch_tags()
    print(f"Loaded {len(tags)} tags: {[t['name'] for t in tags]}")

    # 2. Tavily orqali qidiruv
    print("\n" + "=" * 60)
    print("Tavily Deep Search boshlandi...")
    print("=" * 60)
    search_results = collect_search_results()

    if not search_results:
        print("\nHech qanday natija topilmadi. Tugatildi.")
        return

    # 3. Natijalarni tahlil qilish va publish qilish
    print("\n" + "=" * 60)
    print("Natijalarni tahlil qilish va publish qilish...")
    print("=" * 60)
    process_search_results(search_results, categories, tags)

    print("\n" + "=" * 60)
    print("Deep Search Agent tugatildi.")
    print("=" * 60)


if __name__ == "__main__":
    main()
